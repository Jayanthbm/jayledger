import { supabase } from './supabase';
import { getDb } from '../db/database';
import { 
    insertOrUpdateTransaction, 
    getUnsyncedTransactions,
    updateTransactionSyncStatus
} from '../db/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
};

export const pushLocalChanges = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  console.log("[Sync] Checking for unsynced local data...");

  // 1. Transactions
  const unsyncedTx = await getUnsyncedTransactions(userId);
  if (unsyncedTx.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedTx.length} unsynced transactions...`);
    for (const tx of unsyncedTx) {
      // Whitelist fields for Supabase to match the schema provided
      const txToPush = {
        id: tx.id,
        user_id: tx.user_id,
        amount: tx.amount,
        transaction_timestamp: tx.transaction_timestamp,
        description: tx.description || null,
        category_id: tx.category_id,
        payee_id: tx.payee_id === "null" ? null : (tx.payee_id || null),
        type: tx.type || 'Expense',
        product_link: tx.product_link || null,
        created_at: tx.created_at || new Date().toISOString(),
        updated_at: tx.updated_at || new Date().toISOString(),
      };

      const { error } = await supabase.from('transactions').upsert([txToPush], { onConflict: 'id' });
      if (error) {
        console.error(`[Sync] Error pushing transaction ${tx.id}:`, error);
      } else {
        await updateTransactionSyncStatus(tx.id, 0);
      }
    }
  }

  // Handle deletions
  const deletedTx = await db.getAllAsync<any>(`SELECT id FROM transactions WHERE user_id = '${userId}' AND deleted = 1 AND sync_status = 1`);
  if (deletedTx.length > 0) {
    console.log(`[Sync] Deleting ${deletedTx.length} transactions from Supabase...`);
    for (const tx of deletedTx) {
      const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
      if (!error) {
        await db.execAsync(`DELETE FROM transactions WHERE id = '${tx.id}'`);
      } else {
        console.error(`[Sync] Error deleting transaction ${tx.id}:`, error);
      }
    }
  }

  // 2. Goals
  const unsyncedGoals = await db.getAllAsync<any>(`SELECT * FROM goals WHERE user_id = '${userId}' AND sync_status = 1`);
  for (const goal of unsyncedGoals) {
    const { sync_status, ...goalToPush } = goal;
    const { error } = await supabase.from('goals').upsert([goalToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE goals SET sync_status = 0 WHERE id = '${goal.id}'`);
    }
  }

  // 3. Budgets
  const unsyncedBudgets = await db.getAllAsync<any>(`SELECT * FROM budgets WHERE user_id = '${userId}' AND sync_status = 1`);
  for (const budget of unsyncedBudgets) {
    const { sync_status, ...budgetToPush } = budget;
    const { error } = await supabase.from('budgets').upsert([budgetToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE budgets SET sync_status = 0 WHERE id = '${budget.id}'`);
    }
  }

  console.log("[Sync] Local data push complete.");
};

export const needsTransactionSync = async (userId: string) => {
  if (!(await isOnline())) return false;
  try {
    const db = getDb();
    const maxLocalTx = await db.getFirstAsync<{ transaction_timestamp: string }>(
      `SELECT transaction_timestamp FROM transactions WHERE user_id = '${userId}' ORDER BY transaction_timestamp DESC LIMIT 1`
    );

    if (!maxLocalTx || !maxLocalTx.transaction_timestamp) {
      return true;
    }
    const maxLocalDate = new Date(maxLocalTx.transaction_timestamp);

    const { data: maxSupabaseData, error } = await supabase
      .from('transactions')
      .select('transaction_timestamp')
      .eq('user_id', userId)
      .order('transaction_timestamp', { ascending: false })
      .limit(1);

    if (error || !maxSupabaseData || maxSupabaseData.length === 0) {
      return !error && maxSupabaseData?.length === 0 ? false : true;
    }
    const maxSupabaseDate = new Date(maxSupabaseData[0].transaction_timestamp);
    if (maxLocalDate < maxSupabaseDate) return true;
    return false;
  } catch (error) {
    console.error('[Sync] Error checking if transaction sync is needed:', error);
    return true; 
  }
};

export const syncTransactions = async (userId: string, force = false) => {
  if (!userId || !(await isOnline())) return;

  const needsSync = force || (await needsTransactionSync(userId));
  if (!needsSync) {
    console.log("[Sync] Transactions are up to date!");
    return;
  }

  console.log(`[Sync] Fetching transactions from Supabase...`);
  const CHUNK_SIZE = 1000;
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.rpc('get_user_transactions', {
      uid: userId,
      search_term: '',
      limit_count: CHUNK_SIZE,
      offset_count: offset,
    });
    if (error) break;
    if (!data || data.length === 0) {
        hasMore = false;
        break;
    }
    allData = [...allData, ...data];
    offset += CHUNK_SIZE;
  }

  const db = getDb();
  if (force) {
    await db.execAsync(`DELETE FROM transactions WHERE user_id = '${userId}'`);
  }
  
  // Use a single transaction for all inserts to be massively faster than one-by-one outside
  await db.withTransactionAsync(async () => {
    for (const item of allData) {
      const sanitized = {
        ...item,
        description: (item.description || '').replace(/'/g, "''"),
        category_name: (item.category_name || '').replace(/'/g, "''"),
        payee_name: (item.payee_name || '').replace(/'/g, "''")
      };
      
      await db.execAsync(
        `INSERT OR REPLACE INTO transactions (id, amount, description, transaction_timestamp, date, category_id, category_name, category_icon, category_app_icon, payee_id, payee_name, payee_logo, type, user_id, product_link, sync_status)
         VALUES ('${sanitized.id}', ${sanitized.amount}, '${sanitized.description}', '${sanitized.transaction_timestamp}', '${sanitized.transaction_timestamp.split('T')[0]}', '${sanitized.category_id}', '${sanitized.category_name}', '${sanitized.category_icon}', '${sanitized.category_app_icon}', '${sanitized.payee_id}', '${sanitized.payee_name}', '${sanitized.payee_logo}', '${sanitized.type}', '${sanitized.user_id || userId}', '${sanitized.product_link || ''}', 0)`
      );
    }
  });
};

export const syncGoals = async (userId: string, force = false) => {
  if (!userId || !(await isOnline())) return;
  const db = getDb();
  const { data: goals, error: goalsError } = await supabase.from('goals').select('*').eq('user_id', userId);
  if (!goalsError && goals) {
    await db.withTransactionAsync(async () => {
      if (force) await db.execAsync(`DELETE FROM goals WHERE user_id = '${userId}'`);
      for (const item of goals) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        await db.execAsync(
          `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status)
           VALUES ('${item.id}', '${name}', '${logo}', ${item.goal_amount || 0}, ${item.current_amount || 0}, '${item.user_id}', 0)`
        );
      }
    });
  }
};

export const syncBudgets = async (userId: string, force = false) => {
  if (!userId || !(await isOnline())) return;
  const db = getDb();
  const { data: budgets, error: budgetsError } = await supabase.from('budgets').select('*').eq('user_id', userId);
  if (!budgetsError && budgets) {
    await db.withTransactionAsync(async () => {
      if (force) await db.execAsync(`DELETE FROM budgets WHERE user_id = '${userId}'`);
      for (const item of budgets) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        const categories = item.categories ? JSON.stringify(item.categories).replace(/'/g, "''") : '[]';
        await db.execAsync(
          `INSERT OR REPLACE INTO budgets (id, name, logo, amount, interval, start_date, categories, user_id, sync_status)
           VALUES ('${item.id}', '${name}', '${logo}', ${item.amount || 0}, '${item.interval}', '${item.start_date}', '${categories}', '${item.user_id}', 0)`
        );
      }
    });
  }
};

export const syncCategories = async (userId: string, force = false) => {
    if (!userId || !(await isOnline())) return;
    const db = getDb();
    const { data: categories, error: catsError } = await supabase.from('categories').select('*').eq('user_id', userId);
    if (!catsError && categories) {
        await db.withTransactionAsync(async () => {
            if (force) await db.execAsync(`DELETE FROM categories WHERE user_id = '${userId}'`);
            for (const item of categories) {
                const name = (item.name || '').replace(/'/g, "''");
                const icon = (item.icon || '').replace(/'/g, "''");
                const appIcon = (item.app_icon || '').replace(/'/g, "''");
                await db.execAsync(`INSERT OR REPLACE INTO categories (id, name, type, icon, app_icon, user_id, sync_status) VALUES ('${item.id}', '${name}', '${item.type}', '${icon}', '${appIcon}', '${item.user_id}', 0)`);
            }
        });
    }
};

export const syncPayees = async (userId: string, force = false) => {
    if (!userId || !(await isOnline())) return;
    const db = getDb();
    const { data: payees, error: payeesError } = await supabase.from('payees').select('*').eq('user_id', userId);
    if (!payeesError && payees) {
        await db.withTransactionAsync(async () => {
            if (force) await db.execAsync(`DELETE FROM payees WHERE user_id = '${userId}'`);
            for (const item of payees) {
                const name = (item.name || '').replace(/'/g, "''");
                const logo = (item.logo || '').replace(/'/g, "''");
                await db.execAsync(`INSERT OR REPLACE INTO payees (id, name, logo, user_id, sync_status) VALUES ('${item.id}', '${name}', '${logo}', '${item.user_id}', 0)`);
            }
        });
    }
};

let isSyncingData = false;

export const runFullSync = async (userId: string, force = false) => {
  if (isSyncingData) return;
  isSyncingData = true;
  try {
    if (!(await isOnline())) return;
    console.log(`[Sync] *** Offline-First Sync Initiation ***`);
    await pushLocalChanges(userId);
    await syncTransactions(userId, force);
    await syncGoals(userId, force);
    await syncBudgets(userId, force);
    await syncCategories(userId, force);
    await syncPayees(userId, force);
    await AsyncStorage.setItem(`@last_sync_master_${userId}`, Date.now().toString());
    console.log("[Sync] *** Sync complete ***");
  } catch (error) {
    console.error("[Sync] Sync error:", error);
  } finally {
    isSyncingData = false;
  }
};
