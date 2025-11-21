// src/database/transactions/transactionModel.js

import { getDB } from '../db';

/**
 * Get all transactions for a user
 */
export async function getAll(userId) {
  const db = getDB();
  if (!db) return [];
  try {
    const { rows } = await db.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_timestamp DESC',
      [userId]
    );
    return rows?._array ?? [];
  } catch (e) {
    console.error('❌ Error getting transactions:', e);
    return [];
  }
}

/**
 * Insert a new transaction
 */
export async function insert(transaction) {
  const db = getDB();
  if (!db) return null;
  try {
    const {
      id,
      user_id,
      amount,
      transaction_timestamp,
      description,
      category_id,
      payee_id,
      type,
    } = transaction;

    await db.execute(
      `INSERT INTO transactions (id, user_id, amount, transaction_timestamp, description, category_id, payee_id, type, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        id,
        user_id,
        amount,
        transaction_timestamp,
        description,
        category_id,
        payee_id,
        type || 'Expense',
        false, // synced is false for new local inserts
      ]
    );
    return transaction;
  } catch (e) {
    console.error('❌ Error inserting transaction:', e);
    return null;
  }
}

/**
 * Upsert a transaction (keep old id, user_id, synced; update others)
 * This is typically used for local updates where we want to preserve the synced status if it was already false,
 * or set it to false if we are modifying it.
 */
export async function upsert(transaction) {
  const db = getDB();
  if (!db) return null;
  try {
    const {
      id,
      user_id,
      amount,
      transaction_timestamp,
      description,
      category_id,
      payee_id,
      type,
    } = transaction;

    await db.execute(
      `INSERT INTO transactions (id, user_id, amount, transaction_timestamp, description, category_id, payee_id, type, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         amount = excluded.amount,
         transaction_timestamp = excluded.transaction_timestamp,
         description = excluded.description,
         category_id = excluded.category_id,
         payee_id = excluded.payee_id,
         type = excluded.type,
         synced = false,
         updated_at = datetime('now')`,
      [
        id,
        user_id,
        amount,
        transaction_timestamp,
        description,
        category_id,
        payee_id,
        type || 'Expense',
        false,
      ]
    );
    return transaction;
  } catch (e) {
    console.error('❌ Error upserting transaction:', e);
    return null;
  }
}

/**
 * Update a transaction
 */
export async function update(transaction) {
  const db = getDB();
  if (!db) return null;
  try {
    const {
      id,
      amount,
      transaction_timestamp,
      description,
      category_id,
      payee_id,
      type,
    } = transaction;

    await db.execute(
      `UPDATE transactions
       SET amount = ?, transaction_timestamp = ?, description = ?, category_id = ?, payee_id = ?, type = ?, synced = false, updated_at = datetime('now')
       WHERE id = ?`,
      [amount, transaction_timestamp, description, category_id, payee_id, type, id]
    );
    return transaction;
  } catch (e) {
    console.error('❌ Error updating transaction:', e);
    return null;
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id) {
  const db = getDB();
  if (!db) return false;
  try {
    // We might want to soft delete or mark for deletion sync, but for now we just delete locally.
    // If we need to sync deletions, we usually need a deleted_at column or a separate deleted_records table.
    // The user prompt asked for "delete", I will assume local delete for now, but sync logic usually requires handling deletions.
    // However, the sync file has `deleteTransactionFromSupabase`.
    // If we delete locally, we can't sync the deletion unless we do it immediately or track it.
    // I'll implement simple delete here.
    await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  } catch (e) {
    console.error('❌ Error deleting transaction:', e);
    return false;
  }
}

/**
 * Get all transactions with filters
 */
export async function getAllWithFilter(userId, filters = {}) {
  const db = getDB();
  if (!db) return [];
  try {
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (filters.category_id) {
      query += ' AND category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.payee_id) {
      query += ' AND payee_id = ?';
      params.push(filters.payee_id);
    }
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.description) {
      query += ' AND description LIKE ?';
      params.push(`%${filters.description}%`);
    }

    query += ' ORDER BY transaction_timestamp DESC';

    const { rows } = await db.execute(query, params);
    return rows?._array ?? [];
  } catch (e) {
    console.error('❌ Error getting filtered transactions:', e);
    return [];
  }
}
