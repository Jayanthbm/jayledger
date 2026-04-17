import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';

/**
 * Pushes unsynced local categories to Supabase.
 */
export const pushLocalCategories = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedCategories = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
    icon: string;
    app_icon: string;
    user_id: string;
    sync_status: number;
  }>(`SELECT * FROM categories WHERE user_id = '${userId}' AND sync_status = 1`);

  if (unsyncedCategories.length === 0) return;

  syncLog('Categories', `Pushing ${unsyncedCategories.length} unsynced categories...`);

  for (const cat of unsyncedCategories) {
    const { sync_status: _sync, ...catToPush } = cat;
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .upsert([catToPush], { onConflict: 'id' });
    if (!error) {
      await db.execAsync(`UPDATE categories SET sync_status = 0 WHERE id = '${cat.id}'`);
    }
  }
};

/**
 * Syncs categories from Supabase to local DB.
 */
export const syncCategories = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Categories', 'Starting Sync...');
  await pushLocalCategories(userId);

  const db = getDb();
  const { data: categories, error } = await supabase
    .from(TABLES.CATEGORIES)
    .select('*')
    .eq('user_id', userId);

  if (!error && categories) {
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
    syncLog('Categories', `Saved ${categories.length} categories to local DB.`);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.LAST_SYNC_CATEGORIES}${userId}`,
      Date.now().toString(),
    );
  }
};
