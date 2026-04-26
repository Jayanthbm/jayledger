import { getDb } from './database';
import { QuickTransaction } from '../models/types';

/**
 * Quick Transaction CRUD (Local Only).
 */

export const getQuickTransactions = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<QuickTransaction>(
    `SELECT * FROM quick_transactions WHERE user_id = ? ORDER BY name ASC`,
    [userId],
  );
};

export const insertQuickTransaction = async (qt: QuickTransaction) => {
  const db = getDb();
  return db.runAsync(
    `INSERT INTO quick_transactions (id, name, type, amount, category_id, payee_id, description, user_id, product_link) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  );
};

export const updateQuickTransaction = async (qt: QuickTransaction) => {
  const db = getDb();
  return db.runAsync(
    `UPDATE quick_transactions SET name = ?, type = ?, amount = ?, category_id = ?, payee_id = ?, description = ?, product_link = ?
         WHERE id = ? AND user_id = ?`,
    [
      qt.name,
      qt.type,
      qt.amount || null,
      qt.category_id || null,
      qt.payee_id || null,
      qt.description || null,
      qt.product_link || null,
      qt.id,
      qt.user_id,
    ],
  );
};

export const deleteQuickTransaction = async (id: string, userId: string) => {
  const db = getDb();
  return db.runAsync(`DELETE FROM quick_transactions WHERE id = ? AND user_id = ?`, [id, userId]);
};
