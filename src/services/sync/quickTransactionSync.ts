import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';
import { logger } from '../../utils/logger';
import { QuickTransaction } from '../../models/types';

/**
 * Pushes unsynced local quick transactions to Supabase.
 */
export const pushLocalQuickTransactions = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsynced = await db.getAllAsync<QuickTransaction>(
    `SELECT * FROM quick_transactions WHERE user_id = ? AND sync_status = 1`,
    [userId],
  );

  if (unsynced.length === 0) return;

  syncLog('QuickTransactions', `Pushing ${unsynced.length} unsynced quick transactions...`);

  for (const qt of unsynced) {
    // Hard-delete on Supabase when soft-deleted locally
    if (qt.deleted === 1) {
      const { error } = await supabase.from(TABLES.QUICK_TRANSACTIONS).delete().eq('id', qt.id);

      if (!error) {
        await db.runAsync(`DELETE FROM quick_transactions WHERE id = ? AND user_id = ?`, [
          qt.id,
          userId,
        ]);
        logger.info(`[Sync:QuickTransactions] Deleted ${qt.id} from Supabase and local DB.`);
      } else {
        logger.error(`[Sync:QuickTransactions] Error deleting ${qt.id}:`, error);
      }
      continue;
    }

    const payload = {
      id: qt.id,
      user_id: qt.user_id,
      name: qt.name,
      type: qt.type,
      amount: qt.amount ?? null,
      category_id: qt.category_id ?? null,
      payee_id: qt.payee_id ?? null,
      description: qt.description ?? null,
      product_link: qt.product_link ?? null,
      priority: qt.priority ?? 0,
      identifier: qt.identifier ?? null,
    };

    const { error } = await supabase
      .from(TABLES.QUICK_TRANSACTIONS)
      .upsert([payload], { onConflict: 'id' });

    if (!error) {
      await db.runAsync(
        `UPDATE quick_transactions SET sync_status = 0 WHERE id = ? AND user_id = ?`,
        [qt.id, userId],
      );
      logger.info(`[Sync:QuickTransactions] Pushed ${qt.id}`);
    } else {
      logger.error(`[Sync:QuickTransactions] Error pushing ${qt.id}:`, error);
    }
  }
};

/**
 * Pulls quick transactions from Supabase and merges into local DB.
 */
export const syncQuickTransactions = async (userId: string) => {
  if (!userId || !(await isOnline())) return;

  syncLog('QuickTransactions', 'Starting sync...');

  // Push local changes first
  await pushLocalQuickTransactions(userId);

  const { data, error } = await supabase
    .from(TABLES.QUICK_TRANSACTIONS)
    .select('*')
    .eq('user_id', userId);

  if (error) {
    logger.error('[Sync:QuickTransactions] Error fetching from Supabase:', error);
    return;
  }

  if (!data) return;

  const db = getDb();

  await db.withTransactionAsync(async () => {
    // Remove all non-deleted local rows; Supabase is the source of truth on pull
    await db.runAsync(`DELETE FROM quick_transactions WHERE user_id = ? AND deleted = 0`, [userId]);

    for (const item of data) {
      await db.runAsync(
        `INSERT OR REPLACE INTO quick_transactions
           (id, name, type, amount, category_id, payee_id, description, user_id, product_link, priority, identifier, sync_status, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          item.id,
          item.name,
          item.type,
          item.amount ?? null,
          item.category_id ?? null,
          item.payee_id ?? null,
          item.description ?? null,
          item.user_id,
          item.product_link ?? null,
          item.priority ?? 0,
          item.identifier ?? null,
        ],
      );
    }
  });

  syncLog('QuickTransactions', `Saved ${data.length} quick transactions to local DB.`);
  await AsyncStorage.setItem(
    `${STORAGE_KEYS.LAST_SYNC_QUICK_TRANSACTIONS}${userId}`,
    new Date().toISOString(),
  );
};
