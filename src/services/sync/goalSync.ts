import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';

/**
 * Pushes unsynced local goals to Supabase.
 */
export const pushLocalGoals = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedGoals = await db.getAllAsync<{
    id: string;
    name: string;
    logo: string;
    goal_amount: number;
    current_amount: number;
    user_id: string;
    sync_status: number;
  }>(`SELECT * FROM goals WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsyncedGoals.length === 0) return;

  syncLog('Goals', `Pushing ${unsyncedGoals.length} unsynced goals...`);

  for (const goal of unsyncedGoals) {
    const { sync_status: _sync, ...goalToPush } = goal;
    const { error } = await supabase.from(TABLES.GOALS).upsert([goalToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE goals SET sync_status = 0 WHERE id = '${goal.id}'`);
    }
  }
};

/**
 * Syncs goals from Supabase to local DB.
 */
export const syncGoals = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Goals', 'Starting Sync...');
  await pushLocalGoals(userId);

  const db = getDb();
  const { data: goals, error } = await supabase
    .from(TABLES.GOALS)
    .select('*')
    .eq('user_id', userId);

  if (!error && goals) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM goals WHERE user_id = '${userId}'`);
      for (const item of goals) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        await db.execAsync(
          `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status)
           VALUES ('${item.id}', '${name}', '${logo}', ${item.goal_amount || 0}, ${item.current_amount || 0}, '${item.user_id}', 0)`,
        );
      }
    });
    syncLog('Goals', `Saved ${goals.length} goals to local DB.`);
    await AsyncStorage.setItem(`${STORAGE_KEYS.LAST_SYNC_GOALS}${userId}`, Date.now().toString());
  }
};
