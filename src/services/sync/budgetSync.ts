import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';
import { logger } from '../../utils/logger';

/**
 * Pushes unsynced local budgets to Supabase.
 */
export const pushLocalBudgets = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedBudgets = await db.getAllAsync<{
    id: string;
    name: string;
    logo: string;
    amount: number;
    interval: string;
    start_date: string;
    categories: string;
    user_id: string;
    sync_status: number;
    deleted: number;
  }>(`SELECT * FROM budgets WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsyncedBudgets.length === 0) return;

  syncLog('Budgets', `Pushing ${unsyncedBudgets.length} unsynced budgets...`);

  for (const budget of unsyncedBudgets) {
    if (budget.deleted === 1) {
      const { error } = await supabase.from(TABLES.BUDGETS).delete().eq('id', budget.id);
      if (!error) {
        await db.execAsync(`DELETE FROM budgets WHERE id = '${budget.id}'`);
      } else {
        logger.error(`[Sync:Budgets] Error deleting budget ${budget.id}:`, error);
      }
      continue;
    }

    const { sync_status: _sync, deleted: _del, categories, ...rest } = budget;
    // Standardize interval for Supabase constraint (Month vs Monthly)
    const interval = budget.interval === 'Monthly' ? 'Month' : budget.interval;

    const categoriesArray = JSON.parse(categories || '[]');
    if (categoriesArray.length === 0) {
      logger.error(`[Sync:Budgets] Skipping budget ${budget.id} due to empty categories array`);
      continue;
    }

    const budgetToPush = {
      ...rest,
      interval,
      categories: categoriesArray,
    };
    const { error } = await supabase
      .from(TABLES.BUDGETS)
      .upsert([budgetToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE budgets SET sync_status = 0 WHERE id = '${budget.id}'`);
      logger.info(`[Sync:Budgets] Successfully pushed budget: ${budget.name}`);
    } else {
      logger.error(`[Sync:Budgets] Failed to push budget ${budget.id}:`, error);
    }
  }
};

/**
 * Syncs budgets from Supabase to local DB.
 */
export const syncBudgets = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Budgets', 'Starting Sync...');
  await pushLocalBudgets(userId);

  const db = getDb();
  const { data: budgets, error } = await supabase
    .from(TABLES.BUDGETS)
    .select('*')
    .eq('user_id', userId);

  if (!error && budgets) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM budgets WHERE user_id = '${userId}'`);
      for (const item of budgets) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        const categories = item.categories
          ? JSON.stringify(item.categories).replace(/'/g, "''")
          : '[]';
        await db.execAsync(
          `INSERT OR REPLACE INTO budgets (id, name, logo, amount, interval, start_date, categories, user_id, sync_status)
           VALUES ('${item.id}', '${name}', '${logo}', ${item.amount || 0}, '${item.interval}', '${item.start_date}', '${categories}', '${item.user_id}', 0)`,
        );
      }
    });
    syncLog('Budgets', `Saved ${budgets.length} budgets to local DB.`);
    logger.info(`[Sync:Budgets] Pulled ${budgets.length} budgets from Supabase`);
    await AsyncStorage.setItem(`${STORAGE_KEYS.LAST_SYNC_BUDGETS}${userId}`, Date.now().toString());
  } else if (error) {
    logger.error(`[Sync:Budgets] Pull failed:`, error);
  }
};
