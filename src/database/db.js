// src/database/db.js

import { open } from 'react-native-nitro-sqlite';
import { CATEGORY_TABLE, CATEGORY_INDEX, PAYEE_TABLE, PAYEE_INDEX } from './queries';

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
    await db.execute(CATEGORY_TABLE);
    await db.execute(CATEGORY_INDEX);
    await db.execute(PAYEE_TABLE);
    await db.execute(PAYEE_INDEX);
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
    const db = getDB();
    if (!db) return;
    await db.delete();
    console.log('Database deleted successfully!');
    dbInstance = null;

    console.log('♻️ Reinitializing fresh DB...');
    await initDatabase();
    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Error resetting DB:', error);
  }
};
