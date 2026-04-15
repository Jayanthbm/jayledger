import { supabase } from './supabase';
import { getDb } from '../db/database';
import { 
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

  // 1. Transactions - New (no tid) and Edited (have tid)
  const unsyncedTx = await getUnsyncedTransactions(userId);
  if (unsyncedTx.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedTx.length} unsynced transactions...`);
    for (const tx of unsyncedTx) {
      if (tx.deleted === 1) {
        // Handle deletion
        const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
        if (!error) {
          await db.execAsync(`DELETE FROM transactions WHERE id = '${tx.id}'`);
        } else {
          console.error(`[Sync] Error deleting transaction ${tx.id}:`, error);
        }
        continue;
      }

      // Whitelist fields for Supabase
      const txToPush: any = {
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
        sync_status: 'synced'
      };

      // If tid exists, include it to avoid duplicates if possible, 
      // though id is the primary key. If it doesn't exist (tid=0 or null), 
      // Supabase will generate it.
      if (tx.tid && tx.tid !== 0) {
        txToPush.tid = tx.tid;
      }

      const { data, error } = await supabase
        .from('transactions')
        .upsert([txToPush], { onConflict: 'id' })
        .select('tid');

      if (error) {
        console.error(`[Sync] Error pushing transaction ${tx.id}:`, error);
      } else {
        const newTid = data?.[0]?.tid;
        if (newTid) {
          await db.execAsync(`UPDATE transactions SET tid = ${newTid}, sync_status = 0 WHERE id = '${tx.id}'`);
        } else {
          await updateTransactionSyncStatus(tx.id, 0);
        }
      }
    }
  }

  // 2. Goals
  const unsyncedGoals = await db.getAllAsync<any>(`SELECT * FROM goals WHERE user_id = '${userId}' AND sync_status = 1`);
  if (unsyncedGoals.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedGoals.length} unsynced goals...`);
    for (const goal of unsyncedGoals) {
      const { sync_status, ...goalToPush } = goal;
      const { error } = await supabase.from('goals').upsert([goalToPush], { onConflict: 'id' });
      if (!error) {
        await db.execAsync(`UPDATE goals SET sync_status = 0 WHERE id = '${goal.id}'`);
      }
    }
    console.log(`[Sync] Finished pushing goals.`);
  }

  // 3. Budgets
  const unsyncedBudgets = await db.getAllAsync<any>(`SELECT * FROM budgets WHERE user_id = '${userId}' AND sync_status = 1`);
  if (unsyncedBudgets.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedBudgets.length} unsynced budgets...`);
    for (const budget of unsyncedBudgets) {
      const { sync_status, ...budgetToPush } = budget;
      const { error } = await supabase.from('budgets').upsert([budgetToPush], { onConflict: 'id' });
      if (!error) {
        await db.execAsync(`UPDATE budgets SET sync_status = 0 WHERE id = '${budget.id}'`);
      }
    }
    console.log(`[Sync] Finished pushing budgets.`);
  }

  // 4. Categories
  const unsyncedCategories = await db.getAllAsync<any>(`SELECT * FROM categories WHERE user_id = '${userId}' AND sync_status = 1`);
  if (unsyncedCategories.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedCategories.length} unsynced categories...`);
    for (const cat of unsyncedCategories) {
      const { sync_status, ...catToPush } = cat;
      const { error } = await supabase.from('categories').upsert([catToPush], { onConflict: 'id' });
      if (!error) {
        await db.execAsync(`UPDATE categories SET sync_status = 0 WHERE id = '${cat.id}'`);
      }
    }
    console.log(`[Sync] Finished pushing categories.`);
  }

  // 5. Payees
  const unsyncedPayees = await db.getAllAsync<any>(`SELECT * FROM payees WHERE user_id = '${userId}' AND sync_status = 1`);
  if (unsyncedPayees.length > 0) {
    console.log(`[Sync] Pushing ${unsyncedPayees.length} unsynced payees...`);
    for (const payee of unsyncedPayees) {
      const { sync_status, ...payeeToPush } = payee;
      const { error } = await supabase.from('payees').upsert([payeeToPush], { onConflict: 'id' });
      if (!error) {
        await db.execAsync(`UPDATE payees SET sync_status = 0 WHERE id = '${payee.id}'`);
      }
    }
    console.log(`[Sync] Finished pushing payees.`);
  }

  console.log("[Sync] Local data push complete.");
};

export const needsTransactionSync = async (userId: string) => {
  if (!(await isOnline())) return false;
  try {
    const db = getDb();
    const localMax = await db.getFirstAsync<{ max_tid: number }>(
      `SELECT MAX(tid) as max_tid FROM transactions WHERE user_id = '${userId}'`
    );
    const maxLocalTid = localMax?.max_tid || 0;

    const { data: supabaseMax, error } = await supabase
      .from('transactions')
      .select('tid')
      .eq('user_id', userId)
      .order('tid', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Sync] Supabase error checking needsTransactionSync:', error);
      return false;
    }

    const maxSupabaseTid = supabaseMax?.[0]?.tid || 0;
    return maxLocalTid < maxSupabaseTid;
  } catch (error) {
    console.error('[Sync] Error checking if transaction sync is needed:', error);
    return false;
  }
};

export const syncTransactions = async (userId: string, isPartial = true) => {
  if (!userId || !(await isOnline())) return;

  console.log(`[Sync] Starting ${isPartial ? 'Partial' : 'Force'} Transaction Sync...`);
  
  // Phase 1: Push local changes first
  await pushLocalChanges(userId);

  const db = getDb();
  let lastTid = 0;

  if (isPartial) {
    const localMax = await db.getFirstAsync<{ max_tid: number }>(
      `SELECT MAX(tid) as max_tid FROM transactions WHERE user_id = '${userId}'`
    );
    lastTid = localMax?.max_tid || 0;
  } else {
    // Force sync: delete local transactions first
    await db.execAsync(`DELETE FROM transactions WHERE user_id = '${userId}'`);
  }

  // Phase 2: Pull new transactions from Supabase
  const CHUNK_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.rpc('get_user_transactions', {
      uid: userId,
      after_tid: lastTid,
      limit_count: CHUNK_SIZE,
      offset_count: offset,
    });

    if (error) {
      console.error('[Sync] Error pulling transactions:', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    await db.withTransactionAsync(async () => {
      for (const item of data) {
        const sanitized = {
          ...item,
          description: (item.description || '').replace(/'/g, "''"),
          category_name: (item.category_name || '').replace(/'/g, "''"),
          payee_name: (item.payee_name || '').replace(/'/g, "''")
        };
        
        await db.execAsync(
          `INSERT OR REPLACE INTO transactions (id, amount, description, transaction_timestamp, date, category_id, category_name, category_icon, category_app_icon, payee_id, payee_name, payee_logo, type, user_id, product_link, tid, sync_status)
           VALUES ('${sanitized.id}', ${sanitized.amount}, '${sanitized.description}', '${sanitized.transaction_timestamp}', '${sanitized.transaction_timestamp.split('T')[0]}', '${sanitized.category_id}', '${sanitized.category_name}', '${sanitized.category_icon}', '${sanitized.category_app_icon}', '${sanitized.payee_id}', '${sanitized.payee_name}', '${sanitized.payee_logo}', '${sanitized.type}', '${userId}', '${sanitized.product_link || ''}', ${sanitized.tid}, 0)`
        );
      }
    });

    console.log(`[Sync] Saved ${data.length} transactions to local DB.`);
    offset += CHUNK_SIZE;
  }

  await AsyncStorage.setItem(`@last_sync_transactions_${userId}`, Date.now().toString());
  console.log(`[Sync] Transaction sync completed.`);
};

export const forceTransactionsSync = async (userId: string) => {
  return syncTransactions(userId, false);
};

export const syncGoals = async (userId: string) => {
  if (!userId || !(await isOnline())) return;
  
  console.log("[Sync] Starting Goal Sync...");
  // Phase 1: Push local changes
  await pushLocalChanges(userId);
  
  // Phase 2: Pull all from Supabase and replace local
  const db = getDb();
  const { data: goals, error: goalsError } = await supabase.from('goals').select('*').eq('user_id', userId);
  if (!goalsError && goals) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM goals WHERE user_id = '${userId}'`);
      for (const item of goals) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        await db.execAsync(
          `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status)
           VALUES ('${item.id}', '${name}', '${logo}', ${item.goal_amount || 0}, ${item.current_amount || 0}, '${item.user_id}', 0)`
        );
      }
    });
    console.log(`[Sync] Saved ${goals.length} goals to local DB.`);
    await AsyncStorage.setItem(`@last_sync_goals_${userId}`, Date.now().toString());
  }
  console.log("[Sync] Goal sync completed.");
};

export const syncBudgets = async (userId: string) => {
  if (!userId || !(await isOnline())) return;
  
  console.log("[Sync] Starting Budget Sync...");
  // Phase 1: Push
  await pushLocalChanges(userId);
  
  // Phase 2: Pull all
  const db = getDb();
  const { data: budgets, error: budgetsError } = await supabase.from('budgets').select('*').eq('user_id', userId);
  if (!budgetsError && budgets) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM budgets WHERE user_id = '${userId}'`);
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
    console.log(`[Sync] Saved ${budgets.length} budgets to local DB.`);
    await AsyncStorage.setItem(`@last_sync_budgets_${userId}`, Date.now().toString());
  }
  console.log("[Sync] Budget sync completed.");
};

export const syncCategories = async (userId: string) => {
    if (!userId || !(await isOnline())) return;
    
    console.log("[Sync] Starting Category Sync...");
    // Phase 1: Push
    await pushLocalChanges(userId);
    
    // Phase 2: Pull all
    const db = getDb();
    const { data: categories, error: catsError } = await supabase.from('categories').select('*').eq('user_id', userId);
    if (!catsError && categories) {
        await db.withTransactionAsync(async () => {
            await db.execAsync(`DELETE FROM categories WHERE user_id = '${userId}'`);
            for (const item of categories) {
                const name = (item.name || '').replace(/'/g, "''");
                const icon = (item.icon || '').replace(/'/g, "''");
                const appIcon = (item.app_icon || '').replace(/'/g, "''");
                await db.execAsync(`
                  INSERT INTO categories (id, name, type, icon, app_icon, user_id, sync_status) 
                  VALUES ('${item.id}', '${name}', '${item.type}', '${icon}', '${appIcon}', '${item.user_id}', 0)
                `);
            }
        });
        console.log(`[Sync] Saved ${categories.length} categories to local DB.`);
        await AsyncStorage.setItem(`@last_sync_categories_${userId}`, Date.now().toString());
    }
    console.log("[Sync] Category sync completed.");
};

export const syncPayees = async (userId: string) => {
    if (!userId || !(await isOnline())) return;
    
    console.log("[Sync] Starting Payee Sync...");
    // Phase 1: Push
    await pushLocalChanges(userId);
    
    // Phase 2: Pull all
    const db = getDb();
    const { data: payees, error: payeesError } = await supabase.from('payees').select('*').eq('user_id', userId);
    if (!payeesError && payees) {
        await db.withTransactionAsync(async () => {
            await db.execAsync(`DELETE FROM payees WHERE user_id = '${userId}'`);
            for (const item of payees) {
                const name = (item.name || '').replace(/'/g, "''");
                const logo = (item.logo || '').replace(/'/g, "''");
                await db.execAsync(`INSERT OR REPLACE INTO payees (id, name, logo, user_id, sync_status) VALUES ('${item.id}', '${name}', '${logo}', '${item.user_id}', 0)`);
            }
        });
        console.log(`[Sync] Saved ${payees.length} payees to local DB.`);
        await AsyncStorage.setItem(`@last_sync_payees_${userId}`, Date.now().toString());
    }
    console.log("[Sync] Payee sync completed.");
};

let isSyncingData = false;

export const runFullSync = async (userId: string, onProgress?: (msg: string) => void) => {
  if (isSyncingData) return;
  isSyncingData = true;
  try {
    if (!(await isOnline())) {
      if (onProgress) onProgress('Offline');
      return;
    }
    console.log(`[Sync] *** runFullSync Initiation ***`);
    
    if (onProgress) onProgress('Syncing Transactions (Full)');
    await forceTransactionsSync(userId);
    
    if (onProgress) onProgress('Syncing Goals');
    await syncGoals(userId);
    
    if (onProgress) onProgress('Syncing Budgets');
    await syncBudgets(userId);
    
    if (onProgress) onProgress('Syncing Categories');
    await syncCategories(userId);
    
    if (onProgress) onProgress('Syncing Payees');
    await syncPayees(userId);
    
    if (onProgress) onProgress('Finalizing');
    await AsyncStorage.setItem(`@last_sync_master_${userId}`, Date.now().toString());
    console.log("[Sync] *** Full Sync complete ***");
  } catch (error) {
    console.error("[Sync] Full Sync error:", error);
    if (onProgress) onProgress('Error');
  } finally {
    isSyncingData = false;
  }
};
