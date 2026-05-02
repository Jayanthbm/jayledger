import { getDb } from './database';
import { QuickTransaction } from '../models/types';

/**
 * Quick Transaction CRUD with sync support.
 */

export const getQuickTransactions = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<QuickTransaction>(
    `SELECT * FROM quick_transactions WHERE user_id = ? AND deleted = 0 ORDER BY priority ASC, name ASC`,
    [userId],
  );
};

export const getUnsyncedQuickTransactions = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<QuickTransaction>(
    `SELECT * FROM quick_transactions WHERE user_id = ? AND sync_status = 1`,
    [userId],
  );
};

export const insertQuickTransaction = async (qt: QuickTransaction) => {
  const db = getDb();
  let priority = qt.priority;

  // If priority is 0 (default/new), get the max priority + 1
  if (!priority) {
    const result = await db.getFirstAsync<{ maxP: number }>(
      `SELECT MAX(priority) as maxP FROM quick_transactions WHERE user_id = ?`,
      [qt.user_id],
    );
    priority = (result?.maxP || 0) + 1;
  }

  return db.runAsync(
    `INSERT INTO quick_transactions (id, name, type, amount, category_id, payee_id, description, user_id, product_link, priority, identifier, sync_status, deleted) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      qt.id,
      qt.name,
      qt.type,
      qt.amount || null,
      qt.category_id || null,
      qt.payee_id || null,
      qt.description || null,
      qt.user_id,
      qt.product_link || null,
      priority,
      qt.identifier || null,
    ],
  );
};

export const updateQuickTransaction = async (qt: QuickTransaction) => {
  const db = getDb();
  return db.runAsync(
    `UPDATE quick_transactions SET name = ?, type = ?, amount = ?, category_id = ?, payee_id = ?, description = ?, product_link = ?, priority = ?, identifier = ?, sync_status = 1
         WHERE id = ? AND user_id = ?`,
    [
      qt.name,
      qt.type,
      qt.amount || null,
      qt.category_id || null,
      qt.payee_id || null,
      qt.description || null,
      qt.product_link || null,
      qt.priority,
      qt.identifier || null,
      qt.id,
      qt.user_id,
    ],
  );
};

export const updateQuickTransactionPriorities = async (
  updates: { id: string; priority: number }[],
  userId: string,
) => {
  const db = getDb();
  // Execute updates sequentially without explicit transaction
  // Each UPDATE is atomic, and we're just updating priority fields
  for (const update of updates) {
    await db.runAsync(
      `UPDATE quick_transactions SET priority = ?, sync_status = 1 WHERE id = ? AND user_id = ?`,
      [update.priority, update.id, userId],
    );
  }
};

export const deleteQuickTransaction = async (id: string, userId: string) => {
  const db = getDb();
  // Soft-delete so the sync layer can push the deletion to Supabase
  return db.runAsync(
    `UPDATE quick_transactions SET deleted = 1, sync_status = 1 WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
};

export const insertOrReplaceQuickTransaction = async (
  qt: QuickTransaction,
  syncStatus: number = 0,
) => {
  const db = getDb();
  return db.runAsync(
    `INSERT OR REPLACE INTO quick_transactions
       (id, name, type, amount, category_id, payee_id, description, user_id, product_link, priority, identifier, sync_status, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      qt.id,
      qt.name,
      qt.type,
      qt.amount ?? null,
      qt.category_id ?? null,
      qt.payee_id ?? null,
      qt.description ?? null,
      qt.user_id,
      qt.product_link ?? null,
      qt.priority ?? 0,
      qt.identifier ?? null,
      syncStatus,
    ],
  );
};
