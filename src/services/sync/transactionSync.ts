import { supabase } from '../supabase';
import { getDb } from '../../db/database';
import { getUnsyncedTransactions, updateTransactionSyncStatus } from '../../db/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline, syncLog } from './baseSync';
import { STORAGE_KEYS, TABLES } from '../../constants';
import { logger } from '../../utils/logger';
import { Transaction } from '../../models/types';
import {
  getTransactionDate,
  toSupabaseTransactionTimestamp,
} from '../../utils/transactionTimestamp';

/**
 * Pushes unsynced local transactions to Supabase.
 */
export const pushLocalTransactions = async (userId: string) => {
  if (!(await isOnline())) return;

  const db = getDb();
  const unsyncedTx = await getUnsyncedTransactions(userId);

  if (unsyncedTx.length === 0) return;

  syncLog('Transactions', `Pushing ${unsyncedTx.length} unsynced transactions...`);

  for (const tx of unsyncedTx) {
    if (tx.deleted === 1) {
      const { error } = await supabase.from(TABLES.TRANSACTIONS).delete().eq('id', tx.id);
      if (!error) {
        await db.execAsync(`DELETE FROM transactions WHERE id = '${tx.id}'`);
      } else {
        logger.error(`[Sync:Transactions] Error deleting transaction ${tx.id}:`, error);
      }
      continue;
    }

    const txToPush = {
      id: tx.id,
      user_id: tx.user_id,
      amount: tx.amount,
      transaction_timestamp: toSupabaseTransactionTimestamp(tx.transaction_timestamp),
      description: tx.description || '',
      category_id: tx.category_id,
      payee_id: tx.payee_id === 'null' ? null : tx.payee_id || null,
      type: tx.type || 'Expense',
      product_link: tx.product_link || null,
      latitude: tx.latitude || null,
      longitude: tx.longitude || null,
      created_at: tx.created_at || new Date().toISOString(),
      updated_at: tx.updated_at || new Date().toISOString(),
      ...(tx.tid && tx.tid !== 0 ? { tid: tx.tid } : {}),
    };

    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .upsert([txToPush], { onConflict: 'id' })
      .select('tid');

    if (error) {
      logger.error(`[Sync:Transactions] Error pushing transaction ${tx.id}:`, error);
    } else {
      const newTid = data?.[0]?.tid;
      if (newTid) {
        await db.execAsync(
          `UPDATE transactions SET tid = ${newTid}, sync_status = 0 WHERE id = '${tx.id}'`,
        );
        logger.info(`[Sync:Transactions] Pushed ${tx.id}, new tid: ${newTid}`);
      } else {
        await updateTransactionSyncStatus(tx.id, 0);
        logger.info(`[Sync:Transactions] Pushed ${tx.id} (no tid change)`);
      }
    }
  }
};

/**
 * Syncs transactions from Supabase to local DB.
 */
export const syncTransactions = async (userId: string, isPartial = true) => {
  if (!userId || !(await isOnline())) return;

  syncLog('Transactions', `Starting ${isPartial ? 'Partial' : 'Force'} Sync...`);

  await pushLocalTransactions(userId);

  const db = getDb();
  let lastTid = 0;

  if (isPartial) {
    const localMax = await db.getFirstAsync<{ max_tid: number }>(
      `SELECT MAX(tid) as max_tid FROM transactions WHERE user_id = '${userId}'`,
    );
    lastTid = localMax?.max_tid || 0;
  } else {
    await db.execAsync(`DELETE FROM transactions WHERE user_id = '${userId}'`);
  }

  const CHUNK_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: rawData, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(
        `
        *,
        categories:category_id (
          name,
          icon,
          app_icon
        ),
        payees:payee_id (
          name,
          logo
        )
      `,
      )
      .eq('user_id', userId)
      .gt('tid', lastTid)
      .order('tid', { ascending: true })
      .range(offset, offset + CHUNK_SIZE - 1);

    if (error) {
      logger.error('[Sync:Transactions] Error pulling transactions:', error);
      break;
    }

    const data = rawData?.map(
      (
        item: Transaction & {
          categories: { name: string; icon: string; app_icon: string } | null;
          payees: { name: string; logo: string } | null;
        },
      ) => ({
        ...item,
        category_name: item.categories?.name,
        category_icon: item.categories?.icon,
        category_app_icon: item.categories?.app_icon,
        payee_name: item.payees?.name,
        payee_logo: item.payees?.logo,
      }),
    );

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
          payee_name: (item.payee_name || '').replace(/'/g, "''"),
        };

        await db.execAsync(
          `INSERT OR REPLACE INTO transactions (id, amount, description, transaction_timestamp, date, category_id, category_name, category_icon, category_app_icon, payee_id, payee_name, payee_logo, type, user_id, product_link, tid, latitude, longitude, sync_status)
           VALUES ('${sanitized.id}', ${sanitized.amount}, '${sanitized.description}', '${sanitized.transaction_timestamp}', '${getTransactionDate(sanitized.transaction_timestamp)}', '${sanitized.category_id}', '${sanitized.category_name}', '${sanitized.category_icon}', '${sanitized.category_app_icon}', '${sanitized.payee_id}', '${sanitized.payee_name}', '${sanitized.payee_logo}', '${sanitized.type}', '${userId}', '${sanitized.product_link || ''}', ${sanitized.tid}, ${sanitized.latitude || 'NULL'}, ${sanitized.longitude || 'NULL'}, 0)`,
        );
      }
    });

    syncLog('Transactions', `Saved ${data.length} transactions to local DB.`);
    logger.info(`[Sync:Transactions] Successfully pulled and saved ${data.length} items`);
    offset += CHUNK_SIZE;
  }

  await AsyncStorage.setItem(
    `${STORAGE_KEYS.LAST_SYNC_TRANSACTIONS}${userId}`,
    new Date().toISOString(),
  );
  syncLog('Transactions', 'Sync completed.');
};
