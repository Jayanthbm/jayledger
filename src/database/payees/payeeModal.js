// src/database/payeeModal.js

import { NITRO_SQLITE_NULL } from 'react-native-nitro-sqlite';
import { getDB } from '../db';
import { toSqliteValue } from '../utils';
import uuid from 'react-native-uuid';

export const PayeeModel = {
  getAll: async (userId) => {
    const db = getDB();
    if (!db) {
      console.error('❌ Database not initialized');
      return [];
    }
    const { rows } = await db.execute('SELECT * FROM payees WHERE user_id = ? ORDER BY name ASC', [
      userId,
    ]);
    return rows ? rows._array : [];
  },

  insert: (userId, name, logo = NITRO_SQLITE_NULL, synced = false) => {
    const db = getDB();
    const id = uuid.v4();
    const { rowsAffected } = db.execute(
      `INSERT INTO payees (id, user_id, name, logo, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [id, userId, name, toSqliteValue(logo), synced],
    );
    console.log(`✅ Inserted payee ${name}, rowsAffected: ${rowsAffected}`);
    return id;
  },

  upsert: (id, userId, name, logo = NITRO_SQLITE_NULL) => {
    const db = getDB();
    if (!db) return;
    const { rowsAffected } = db.execute(
      `
        INSERT INTO payees (id, user_id, name, logo, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          logo = excluded.logo,
          updated_at = datetime('now');
        `,
      [id, userId, name, logo],
    );

    console.log(`🔄 Upserted payee ${name}, rowsAffected: ${rowsAffected}`);
    return id;
  },

  update: (id, name, logo, synced) => {
    const db = getDB();
    const { rowsAffected } = db.execute(
      `UPDATE payees
       SET name=?, logo=?, synced=?, updated_at=datetime('now')
       WHERE id=?`,
      [name, toSqliteValue(logo), synced, id],
    );
    console.log(`✅ Updated payee ${id}, rowsAffected: ${rowsAffected}`);
  },
  delete: (id) => {
    const db = getDB();
    const { rowsAffected } = db.execute('DELETE FROM payees WHERE id = ?', [id]);
    console.log(`🗑️ Deleted payee ${id}, rowsAffected: ${rowsAffected}`);
  },
};
