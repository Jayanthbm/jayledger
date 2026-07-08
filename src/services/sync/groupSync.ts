import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';

/**
 * Pushes unsynced local transaction groups to Supabase.
 */
export const pushLocalGroups = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedGroups = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    user_id: string;
    priority: number;
    sync_status: number;
  }>(`SELECT * FROM transaction_groups WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsyncedGroups.length === 0) return;

  syncLog('Groups', `Pushing ${unsyncedGroups.length} unsynced groups...`);

  for (const group of unsyncedGroups) {
    const { sync_status: _sync, ...groupToPush } = group;
    const { error } = await supabase
      .from(TABLES.TRANSACTION_GROUPS)
      .upsert([groupToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE transaction_groups SET sync_status = 0 WHERE id = '${group.id}'`);
    }
  }
};

/**
 * Syncs transaction groups from Supabase to local DB.
 */
export const syncGroups = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Groups', 'Starting Sync...');
  await pushLocalGroups(userId);

  const db = getDb();
  const { data: groups, error } = await supabase
    .from(TABLES.TRANSACTION_GROUPS)
    .select('*')
    .eq('user_id', userId);

  if (!error && groups) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM transaction_groups WHERE user_id = '${userId}'`);
      for (const item of groups) {
        const name = (item.name || '').replace(/'/g, "''");
        const desc = (item.description || '').replace(/'/g, "''");
        const priority = item.priority ?? 0;
        await db.execAsync(`
          INSERT INTO transaction_groups (id, name, description, user_id, priority, sync_status) 
          VALUES ('${item.id}', '${name}', '${desc}', '${item.user_id}', ${priority}, 0)
        `);
      }
    });
    syncLog('Groups', `Saved ${groups.length} groups to local DB.`);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LAST_SYNC_TRANSACTION_GROUPS}${userId}`,
      new Date().toISOString(),
    );
  }
};
