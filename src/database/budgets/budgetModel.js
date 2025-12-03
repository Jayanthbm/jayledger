// src/database/budgets/budgetModel.js

import { NITRO_SQLITE_NULL } from 'react-native-nitro-sqlite';
import { getDB } from '../db';
import { toSqliteValue } from '../utils';
import uuid from 'react-native-uuid';

export const BudgetModel = {
  getAll: async (userId) => {
    const db = getDB();
    if (!db) {
      console.error('❌ Database not initialized');
      return [];
    }
    const { rows } = await db.execute('SELECT * FROM budgets WHERE user_id = ? ORDER BY name ASC', [
      userId,
    ]);
    return rows ? rows._array : [];
  },

  insert: (userId, name, amount, interval = 'Month', start_date, categories) => {
    const db = getDB();
    const id = uuid.v4();
    const { rowsAffected } = db.execute(
      `INSERT INTO budgets (id, user_id, name, amount, interval, start_date, categories, synced, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [id, userId, name, amount, interval, start_date, categories, false],
    );
    console.log(`✅ Inserted budget ${name}, rowsAffected: ${rowsAffected}`);
    return id;
  },

  upsert: (id, userId, name, amount, interval = 'Month', start_date, categories) => {
    const db = getDB();
    if (!db) return;
    const { rowsAffected } = db.execute(
      `
        INSERT INTO budgets (id, user_id, name, amount, interval, start_date, categories, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          amount = excluded.amount,
          interval = excluded.interval,
          start_date = excluded.start_date,
          categories = excluded.categories,
          updated_at = datetime('now');
        `,
      [id, userId, name, amount, interval, start_date, categories],
    );

    console.log(`🔄 Upserted budget ${name}, rowsAffected: ${rowsAffected}`);
    return id;
  },

  update: (id, name, amount, interval, start_date, categories) => {
    const db = getDB();
    const { rowsAffected } = db.execute(
      `UPDATE budgets
       SET name=?, amount=?, interval=?, start_date=?, categories=?, updated_at=datetime('now')
       WHERE id=?`,
      [name, amount, interval, start_date, categories, id],
    );
    console.log(`✅ Updated budget ${id}, rowsAffected: ${rowsAffected}`);
  },

  delete: (id) => {
    const db = getDB();
    const { rowsAffected } = db.execute('DELETE FROM budgets WHERE id = ?', [id]);
    console.log(`🗑️ Deleted budget ${id}, rowsAffected: ${rowsAffected}`);
  },
};
