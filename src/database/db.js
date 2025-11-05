// src/database/db.js

import { deleteDatabase, open } from 'react-native-nitro-sqlite';

let dbInstance = null;

/**
 * Get (or create) the database instance.
 * Does NOT reinitialize schema each time.
 */
export function getDB() {
  if (!dbInstance) {
    try {
      dbInstance = open({ name: 'jayledger.db' });
      console.log('✅ DB connection ready');
    } catch (error) {
      console.error('❌ Error opening DB:', error);
      return null;
    }
  }

  return dbInstance;
}

/**
 * Initialize DB schema (run only once or after reset)
 */
export async function initDatabase() {
  const db = getDB();
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        app_icon TEXT,
        synced BOOLEAN DEFAULT true,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_user_type
      ON categories (user_id, type);
    `);

    console.log('✅ Database initialized successfully');
  } catch (e) {
    console.error('❌ Error initializing DB:', e);
  }
}

/**
 * Delete and reinitialize the database.
 */
export const resetInitDb = async () => {
  try {
    console.log('🗑️ Deleting existing database...');
    await deleteDatabase({ name: 'jayledger.db' });
    dbInstance = null;

    console.log('♻️ Reinitializing fresh DB...');
    await initDatabase();
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Error resetting DB:', error);
  }
};
