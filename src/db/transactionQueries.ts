import { getDb } from './database';
import { Transaction } from '../models/types';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

/**
 * Basic Transaction CRUD and Lookups.
 */

export const getTransactionsByDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND deleted = 0 ORDER BY transaction_timestamp DESC`,
    [userId, startDate, endDate],
  );
};

export const getUnsyncedTransactions = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND sync_status = 1`,
    [userId],
  );
};

export const updateTransactionSyncStatus = async (id: string, status: number) => {
  const db = getDb();
  await db.execAsync(`UPDATE transactions SET sync_status = ${status} WHERE id = '${id}'`);
};

export const insertOrUpdateTransaction = async (tx: Transaction, syncStatus: number = 0) => {
  const db = getDb();
  logger.info(`[DB:Transaction] upsert: ${tx.id} (${tx.description})`);
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO transactions (
        id, amount, description, transaction_timestamp, date,
        category_id, category_name, category_icon, category_app_icon,
        payee_id, payee_name, payee_logo, type, user_id,
        product_link, tid, latitude, longitude, sync_status, created_at, updated_at, deleted,
        group_id, group_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.amount,
        tx.description || '',
        tx.transaction_timestamp,
        tx.date,
        tx.category_id,
        tx.category_name || '',
        tx.category_icon || '',
        tx.category_app_icon || null,
        tx.payee_id || null,
        tx.payee_name || null,
        tx.payee_logo || null,
        tx.type,
        tx.user_id,
        tx.product_link || null,
        tx.tid || 0,
        tx.latitude || null,
        tx.longitude || null,
        syncStatus,
        tx.created_at || new Date().toISOString(),
        tx.updated_at || new Date().toISOString(),
        0,
        tx.group_id || null,
        tx.group_name || null,
      ],
    );
  } catch (err) {
    logger.error(`[DB:Transaction] upsert failed: ${tx.id}`, err);
    throw err;
  }
};

export const deleteTransactionAsync = async (id: string, userId: string) => {
  const db = getDb();
  logger.info(`[DB:Transaction] deleting: ${id}`);
  await db.runAsync(
    `UPDATE transactions SET deleted = 1, sync_status = 1 WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
};

export const getNetWorth = async (userId: string) => {
  const db = getDb();
  const row = await db.getFirstAsync<{ amount: number }>(
    `SELECT SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END) as amount FROM transactions WHERE user_id = ? AND deleted = 0`,
    [userId],
  );
  return row?.amount || 0;
};

export const getSpentToday = async (userId: string, todayDate: string) => {
  const db = getDb();
  const row = await db.getFirstAsync<{ amount: number }>(
    `SELECT SUM(amount) as amount FROM transactions WHERE user_id = ? AND type = 'Expense' AND date = ? AND deleted = 0`,
    [userId, todayDate],
  );
  return row?.amount || 0;
};

export const getTransactionsByDate = async (userId: string, date: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND date = ? AND deleted = 0 ORDER BY transaction_timestamp DESC`,
    [userId, date],
  );
};

export const getMinTransactionYear = async (userId: string) => {
  const db = getDb();
  const result = await db.getFirstAsync<{ min_year: number | null }>(
    `SELECT MIN(strftime('%Y', date)) as min_year FROM transactions WHERE user_id = ? AND deleted = 0`,
    [userId],
  );
  return result?.min_year || new Date().getFullYear();
};

export const getMinTransactionDate = async (userId: string) => {
  const db = getDb();
  const result = await db.getFirstAsync<{ min_date: string | null }>(
    `SELECT MIN(date) as min_date FROM transactions WHERE user_id = ? AND deleted = 0`,
    [userId],
  );
  return result?.min_date || format(new Date(), 'yyyy-MM-dd');
};
