import * as SQLite from 'expo-sqlite';
import { Transaction, Goal, Budget, Category, Payee } from '../models/types';

const DB_NAME = 'jayledger.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
};

export const initDB = async () => {
  const db = getDb();
  
  // Create tables if they do not exist asynchronously allowing JNI memory pool mapping safely
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      transaction_timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      category_id TEXT,
      category_name TEXT,
      category_icon TEXT,
      category_app_icon TEXT,
      payee_id TEXT,
      payee_name TEXT,
      payee_logo TEXT,
      type TEXT,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      goal_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      amount REAL NOT NULL,
      interval TEXT,
      start_date TEXT,
      categories TEXT,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      app_icon TEXT,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payees (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      user_id TEXT NOT NULL
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  `);

  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN category_app_icon TEXT;`);
  } catch(e) {}
};
