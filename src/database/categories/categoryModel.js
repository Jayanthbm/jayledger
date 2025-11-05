// src/database/categories/categoryModel.js

import { NITRO_SQLITE_NULL } from 'react-native-nitro-sqlite'
import { getDB } from '../db';
import { toSqliteValue } from '../utils'
import uuid from 'react-native-uuid';

export const CategoryModel = {
   getAll: async (userId) => {
      const db = getDB();
      if (!db) {
         console.error('❌ Database not initialized');
         return [];
      }

      const { rows } = await db.execute(
         'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
         [userId]
      );
      return rows ? rows._array : [];
   },

   getByType: (userId, type) => {
      const db = getDB();
      const { rows } = db.execute(
         'SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name ASC',
         [userId, type]
      );
      return rows ?? [];
   },

   insert: (userId, name, type, icon = NITRO_SQLITE_NULL, app_icon = NITRO_SQLITE_NULL, synced = false) => {
      const db = getDB();
      const id = uuid.v4();
      const { rowsAffected } = db.execute(
         `INSERT INTO categories (id, user_id, name, type, icon, app_icon, synced,updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?,datetime('now'))`,
         [id, userId, name, type, toSqliteValue(icon), toSqliteValue(app_icon), synced]
      );

      console.log(`✅ Inserted category ${name}, rowsAffected: ${rowsAffected}`);
      return id;
   },

   upsert: (id, userId, name, type, icon = NITRO_SQLITE_NULL, app_icon = NITRO_SQLITE_NULL) => {
      const db = getDB();
      if (!db) return;

      const { rowsAffected } = db.execute(
         `
      INSERT INTO categories (id, user_id, name, type, icon, app_icon, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        icon = excluded.icon,
        app_icon = excluded.app_icon,
        updated_at = datetime('now');
      `,
         [id, userId, name, type, icon, app_icon]
      );

      console.log(`🔄 Upserted category ${name}, rowsAffected: ${rowsAffected}`);
      return id;
   },

   update: (id, name, type, icon, app_icon, synced) => {
      const db = getDB();
      const { rowsAffected } = db.execute(
         `UPDATE categories
       SET name=?, type=?, icon=?, app_icon=?,synced=?, updated_at=datetime('now')
       WHERE id=?`,
         [name, type, icon, app_icon, synced, id]
      );
      console.log(`✅ Updated category ${id}, rowsAffected: ${rowsAffected}`);
   },

   delete: (id) => {
      const db = getDB();
      const { rowsAffected } = db.execute(
         'DELETE FROM categories WHERE id = ?',
         [id]
      );
      console.log(`🗑️ Deleted category ${id}, rowsAffected: ${rowsAffected}`);
   },
};
