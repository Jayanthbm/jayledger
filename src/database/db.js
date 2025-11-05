// src/database/db.js
import { deleteDatabase, open } from 'react-native-nitro-sqlite';

let dbInstance = null;

/**
 * Get (or create) the database instance
 */
export function getDB(intializeDb = false) {
  if (!dbInstance) {
    try {
      dbInstance = open({ name: 'jayledger.db' });
      if (intializeDb) {
        initDatabase(dbInstance);
      }

      console.log('✅ DB connection ready');
    } catch (error) {
      console.error('❌ Error opening DB:', error);
      return null;
    }
  }

  return dbInstance;
}

/**
 * Initialize DB schema
 */
async function initDatabase(db) {
  if (!db) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories(
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      app_icon TEXT,
      synced boolean DEFAULT true,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_categories_user_type
      ON categories(user_id, type);
    `);

    console.log('✅ Database initialized successfully');
  } catch (e) {
    console.error('❌ Error initializing DB:', e);
  }
}

/**
 * Delete and reinitialize the database
 */
export const resetInitDb = async () => {
  try {
    console.log('🗑️ Deleting existing database...');
    await deleteDatabase({ name: 'jayledger.db' });

    // Reset the cached instance
    dbInstance = null;

    console.log('♻️ Reinitializing fresh DB...');
    const db = getDB();
    console.log('✅ Database reset complete');
    return db;
  } catch (error) {
    console.error('❌ Error resetting DB:', error);
  }
};
