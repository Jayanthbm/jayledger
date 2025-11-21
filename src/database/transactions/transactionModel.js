// src/database/transactions/transactionModel.js

import { NITRO_SQLITE_NULL } from 'react-native-nitro-sqlite';
import { getDB } from '../db';
import { toSqliteValue } from '../utils';
import uuid from 'react-native-uuid';

export const TransactionModel = {
  /**
   * Get all transactions for a user
   */
  getAll: async (userId) => {
    const db = getDB();
    if (!db) return [];

    try {
      const { rows } = await db.execute(
        `SELECT * FROM transactions
         WHERE user_id = ?
         ORDER BY transaction_timestamp DESC`,
        [userId],
      );

      return rows?._array ?? [];
    } catch (e) {
      console.error('❌ Error getting transactions:', e);
      return [];
    }
  },

  /**
   * Get transactions with optional filters
   */
  getAllWithFilter: async (userId, filters = {}) => {
    const db = getDB();
    if (!db) return [];

    try {
      let query = `SELECT * FROM transactions WHERE user_id = ?`;
      const params = [userId];

      if (filters.category_id) {
        query += ` AND category_id = ?`;
        params.push(filters.category_id);
      }
      if (filters.payee_id) {
        query += ` AND payee_id = ?`;
        params.push(filters.payee_id);
      }
      if (filters.type) {
        query += ` AND type = ?`;
        params.push(filters.type);
      }
      if (filters.description) {
        query += ` AND description LIKE ?`;
        params.push(`%${filters.description}%`);
      }

      query += ` ORDER BY transaction_timestamp DESC`;

      const { rows } = await db.execute(query, params);
      return rows?._array ?? [];
    } catch (e) {
      console.error('❌ Error getting filtered transactions:', e);
      return [];
    }
  },

  /**
   * Insert a new transaction
   */
  insert: ({
    user_id,
    amount,
    transaction_timestamp,
    description = '',
    category_id = NITRO_SQLITE_NULL,
    payee_id = NITRO_SQLITE_NULL,
    type = 'Expense',
    synced = false,
  }) => {
    const db = getDB();
    if (!db) return null;

    const id = uuid.v4();

    try {
      const { rowsAffected } = db.execute(
        `INSERT INTO transactions
         (id, user_id, amount, transaction_timestamp, description, category_id, payee_id, type, synced, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          id,
          user_id,
          amount,
          transaction_timestamp,
          description,
          toSqliteValue(category_id),
          toSqliteValue(payee_id),
          type,
          synced,
        ],
      );

      console.log(`✅ Inserted transaction ${id}, rowsAffected: ${rowsAffected}`);
      return id;
    } catch (e) {
      console.error('❌ Error inserting transaction:', e);
      return null;
    }
  },

  /**
   * Upsert a transaction (keep synced=false)
   */
  upsert: ({
    id,
    user_id,
    amount,
    transaction_timestamp,
    description,
    category_id,
    payee_id,
    type = 'Expense',
  }) => {
    const db = getDB();
    if (!db) return null;

    try {
      const { rowsAffected } = db.execute(
        `
        INSERT INTO transactions
        (id, user_id, amount, transaction_timestamp, description, category_id, payee_id, type, synced, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, false, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          amount = excluded.amount,
          transaction_timestamp = excluded.transaction_timestamp,
          description = excluded.description,
          category_id = excluded.category_id,
          payee_id = excluded.payee_id,
          type = excluded.type,
          synced = false,
          updated_at = datetime('now')
        `,
        [
          id,
          user_id,
          amount,
          transaction_timestamp,
          description,
          toSqliteValue(category_id),
          toSqliteValue(payee_id),
          type,
        ],
      );

      console.log(`🔄 Upserted transaction ${id}, rowsAffected: ${rowsAffected}`);
      return id;
    } catch (e) {
      console.error('❌ Error upserting transaction:', e);
      return null;
    }
  },

  /**
   * Update a transaction
   */
  update: ({ id, amount, transaction_timestamp, description, category_id, payee_id, type }) => {
    const db = getDB();
    if (!db) return null;

    try {
      const { rowsAffected } = db.execute(
        `
        UPDATE transactions
        SET amount=?, transaction_timestamp=?, description=?, category_id=?, payee_id=?, type=?,
            synced=false, updated_at=datetime('now')
        WHERE id=?
      `,
        [
          amount,
          transaction_timestamp,
          description,
          toSqliteValue(category_id),
          toSqliteValue(payee_id),
          type,
          id,
        ],
      );

      console.log(`✏️ Updated transaction ${id}, rowsAffected: ${rowsAffected}`);
      return id;
    } catch (e) {
      console.error('❌ Error updating transaction:', e);
      return null;
    }
  },

  /**
   * Delete a transaction
   */
  delete: (id) => {
    const db = getDB();
    if (!db) return false;

    try {
      const { rowsAffected } = db.execute(`DELETE FROM transactions WHERE id = ?`, [id]);

      console.log(`🗑️ Deleted transaction ${id}, rowsAffected: ${rowsAffected}`);
      return rowsAffected > 0;
    } catch (e) {
      console.error('❌ Error deleting transaction:', e);
      return false;
    }
  },
};
