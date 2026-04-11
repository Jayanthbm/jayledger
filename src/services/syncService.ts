import { supabase } from './supabase';
import { getDb } from '../db/database';
import { getTransactionsByDateRange, insertOrUpdateTransaction, deleteTransactionAsync } from '../db/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const needsTransactionSync = async (userId: string) => {
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

    if (maxLocalDate < maxSupabaseDate) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Sync] Error checking if transaction sync is needed:', error);
    return true; // Fail-safe: sync if check throws
  }
};

export const syncTransactions = async (userId: string) => {
  if (!userId) return;

  const needsSync = await needsTransactionSync(userId);
  if (!needsSync) {
    console.log("[Sync] Transactions are up to date! Skipping 4000+ row transfer payload.");
    return;
  }

  console.log("[Sync] Needs sync verified. Fetching Transactions from Supabase...");
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

    if (error) {
      console.error('[Sync] Error fetching transactions:', error);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    allData = [...allData, ...data];
    offset += CHUNK_SIZE;
  }

  const db = getDb();
  console.log(`[Sync] Network complete. Locking NativeDatabase to integrate ${allData.length} records...`);
  
  await db.withExclusiveTransactionAsync(async () => {
    await db.execAsync(`DELETE FROM transactions WHERE user_id = '${userId}'`);
    for (const item of allData) {
      await insertOrUpdateTransaction({
        id: item.id,
        amount: item.amount,
        description: item.description,
        transaction_timestamp: item.transaction_timestamp,
        date: item.transaction_timestamp.split('T')[0],
        category_id: item.category_id,
        category_name: item.category_name,
        category_icon: item.category_icon,
        category_app_icon: item.category_app_icon,
        payee_id: item.payee_id,
        payee_name: item.payee_name,
        payee_logo: item.payee_logo,
        type: item.type,
        user_id: item.user_id || userId,
      });
    }
  });
  console.log("[Sync] Transactions sync strictly locked and committed.");
};

export const syncGoals = async (userId: string) => {
  if (!userId || isSyncingGoals) return;
  isSyncingGoals = true;
  try {
    console.log("[Sync] Pre-fetching Goals securely concurrently over HTTPS...");
    
    const { data: goals, error: goalsError } = await supabase.from('goals').select('*').eq('user_id', userId);

    const db = getDb();
    await db.withExclusiveTransactionAsync(async () => {
      if (!goalsError && goals) {
        await db.execAsync(`DELETE FROM goals WHERE user_id = '${userId}'`);
        for (const item of goals) {
          const name = (item.name || '').replace(/'/g, "''");
          const logo = (item.logo || '').replace(/'/g, "''");
          await db.execAsync(
            `INSERT INTO goals (id, name, logo, goal_amount, current_amount, user_id) 
             VALUES ('${item.id}', '${name}', '${logo}', ${item.goal_amount || 0}, ${item.current_amount || 0}, '${item.user_id}')`
          );
        }
      }
    });

    try {
      await AsyncStorage.setItem(`@last_sync_master_${userId}`, Date.now().toString());
    } catch (e) {}
    
    console.log("[Sync] Goals explicitly sequestered natively offline.");
  } finally {
    isSyncingGoals = false;
  }
};

let isSyncingBudgets = false;
export const syncBudgets = async (userId: string) => {
  if (!userId || isSyncingBudgets) return;
  isSyncingBudgets = true;
  try {
    console.log("[Sync] Pre-fetching Budgets purely concurrently over HTTPS...");
    
    const { data: budgets, error: budgetsError } = await supabase.from('budgets').select('*').eq('user_id', userId);

    const db = getDb();
    await db.withExclusiveTransactionAsync(async () => {
      if (!budgetsError && budgets) {
        await db.execAsync(`DELETE FROM budgets WHERE user_id = '${userId}'`);
        for (const item of budgets) {
          const name = (item.name || '').replace(/'/g, "''");
          const logo = (item.logo || '').replace(/'/g, "''");
          const categories = item.categories ? JSON.stringify(item.categories).replace(/'/g, "''") : '[]';
          await db.execAsync(
            `INSERT INTO budgets (id, name, logo, amount, interval, start_date, categories, user_id) 
             VALUES ('${item.id}', '${name}', '${logo}', ${item.amount || 0}, '${item.interval}', '${item.start_date}', '${categories}', '${item.user_id}')`
          );
        }
      }
    });

    try {
      await AsyncStorage.setItem(`@last_sync_master_${userId}`, Date.now().toString());
    } catch (e) {}

    console.log("[Sync] Budgets rigidly sequestered offline specifically.");
  } finally {
    isSyncingBudgets = false;
  }
};

let isSyncingCatsPayees = false;
let isSyncingCategories = false;
export const syncCategories = async (userId: string) => {
  if (!userId || isSyncingCategories) return;
  isSyncingCategories = true;
  try {
    console.log("[Sync] Pre-fetching Categories concurrently natively...");
    const { data: categories, error: catsError } = await supabase.from('categories').select('*').eq('user_id', userId);

    const db = getDb();
    await db.withExclusiveTransactionAsync(async () => {
      if (!catsError && categories) {
        await db.execAsync(`DELETE FROM categories WHERE user_id = '${userId}'`);
        for (const item of categories) {
          const name = (item.name || '').replace(/'/g, "''");
          const icon = (item.icon || '').replace(/'/g, "''");
          const appIcon = (item.app_icon || '').replace(/'/g, "''");
          await db.execAsync(
            `INSERT INTO categories (id, name, type, icon, app_icon, user_id) 
             VALUES ('${item.id}', '${name}', '${item.type}', '${icon}', '${appIcon}', '${item.user_id}')`
          );
        }
      }
    });

    try {
      await AsyncStorage.setItem(`@last_sync_categories_${userId}`, Date.now().toString());
    } catch(e) {}
    
    console.log("[Sync] Categories rigidly serialized.");
  } finally {
    isSyncingCategories = false;
  }
};

let isSyncingPayees = false;
export const syncPayees = async (userId: string) => {
  if (!userId || isSyncingPayees) return;
  isSyncingPayees = true;
  try {
    console.log("[Sync] Pre-fetching Payees concurrently natively...");
    const { data: payees, error: payeesError } = await supabase.from('payees').select('*').eq('user_id', userId);

    const db = getDb();
    await db.withExclusiveTransactionAsync(async () => {
      if (!payeesError && payees) {
        await db.execAsync(`DELETE FROM payees WHERE user_id = '${userId}'`);
        for (const item of payees) {
          const name = (item.name || '').replace(/'/g, "''");
          const logo = (item.logo || '').replace(/'/g, "''");
          await db.execAsync(
            `INSERT INTO payees (id, name, logo, user_id) 
             VALUES ('${item.id}', '${name}', '${logo}', '${item.user_id}')`
          );
        }
      }
    });

    try {
      await AsyncStorage.setItem(`@last_sync_payees_${userId}`, Date.now().toString());
    } catch(e) {}
    
    console.log("[Sync] Payees rigidly serialized.");
  } finally {
    isSyncingPayees = false;
  }
};

let isSyncingGoals = false;

let isSyncingData = false;

export const pushCategory = async (category: any) => {
  const { error } = await supabase.from('categories').insert([category]);
  if (error) {
    console.error("Failed to push category to Supabase: ", error);
  }
};

export const pushGoal = async (goal: any) => {
  const { error } = await supabase.from('goals').upsert([goal], { onConflict: 'id' });
  if (error) {
    console.error("Failed to upsert goal to Supabase: ", error);
  }
};

export const pushGoalDelete = async (id: string, userId: string) => {
  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
  if (error) {
    console.error("Failed to delete goal remotely: ", error);
  }
};

export const pushPayee = async (payee: any) => {
  const { error } = await supabase.from('payees').insert([payee]);
  if (error) {
    console.error("Failed to push payee to Supabase: ", error);
  }
};

export const runFullSync = async (userId: string) => {
  if (isSyncingData) {
    console.log("[Sync] Process globally locked. Skipping concurrent race condition.");
    return;
  }
  isSyncingData = true;
  try {
    console.log("[Sync] *** Full Refresh Sequence INITIATED ***");
    await syncTransactions(userId);
    console.log("[Sync] *** Boot sync flawlessly mapped! ***");
  } catch (error) {
    console.error("[Sync] CATASTROPHIC STOP during full sync mapping sequence. Execution crashed at exactly this component trace.", error);
    throw error;
  } finally {
    isSyncingData = false;
  }
};
