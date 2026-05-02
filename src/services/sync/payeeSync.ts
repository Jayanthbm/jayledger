import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';

/**
 * Pushes unsynced local payees to Supabase.
 */
export const pushLocalPayees = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedPayees = await db.getAllAsync<{
    id: string;
    name: string;
    logo: string;
    user_id: string;
    priority: number;
    sync_status: number;
  }>(`SELECT * FROM payees WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsyncedPayees.length === 0) return;

  syncLog('Payees', `Pushing ${unsyncedPayees.length} unsynced payees...`);

  for (const payee of unsyncedPayees) {
    const { sync_status: _sync, ...payeeToPush } = payee;
    const { error } = await supabase
      .from(TABLES.PAYEES)
      .upsert([payeeToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE payees SET sync_status = 0 WHERE id = '${payee.id}'`);
    }
  }
};

/**
 * Syncs payees from Supabase to local DB.
 */
export const syncPayees = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Payees', 'Starting Sync...');
  await pushLocalPayees(userId);

  const db = getDb();
  const { data: payees, error } = await supabase
    .from(TABLES.PAYEES)
    .select('*')
    .eq('user_id', userId);

  if (!error && payees) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`DELETE FROM payees WHERE user_id = '${userId}'`);
      for (const item of payees) {
        const name = (item.name || '').replace(/'/g, "''");
        const logo = (item.logo || '').replace(/'/g, "''");
        const priority = item.priority ?? 0;
        await db.execAsync(
          `INSERT OR REPLACE INTO payees (id, name, logo, user_id, priority, sync_status) VALUES ('${item.id}', '${name}', '${logo}', '${item.user_id}', ${priority}, 0)`,
        );
      }
    });
    syncLog('Payees', `Saved ${payees.length} payees to local DB.`);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LAST_SYNC_PAYEES}${userId}`,
      new Date().toISOString(),
    );
  }
};
