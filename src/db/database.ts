import * as SQLite from 'expo-sqlite';

const DB_NAME = 'jayledger.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  try {
    if (!dbInstance) {
      console.log("[DB] Opening database sync...");
      dbInstance = SQLite.openDatabaseSync(DB_NAME);
      console.log("[DB] Database opened successfully.");
    }
    return dbInstance;
  } catch (error) {
    console.error("[DB] Failed to open database:", error);
    throw error;
  }
};

export const initDB = async () => {
  const db = getDb();
  console.log("[DB] Starting initDB migrations...");
  
  try {
    console.log("[DB] Setting journal_mode = WAL...");
    await db.execAsync("PRAGMA journal_mode = WAL;");

    console.log("[DB] Creating tables...");
    await db.execAsync(`
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
        user_id TEXT NOT NULL,
        product_link TEXT,
        tid INTEGER DEFAULT 0,
        sync_status INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        deleted INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        goal_amount REAL NOT NULL,
        current_amount REAL NOT NULL,
        user_id TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        amount REAL NOT NULL,
        interval TEXT,
        start_date TEXT,
        categories TEXT,
        user_id TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        app_icon TEXT,
        user_id TEXT NOT NULL,
        is_living_cost INTEGER DEFAULT 0,
        sync_status INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payees (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        logo TEXT,
        user_id TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS quick_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL,
        category_id TEXT,
        payee_id TEXT,
        description TEXT,
        user_id TEXT NOT NULL
      );
    `);

    console.log("[DB] Running migrations...");
    const coreTables = ['transactions', 'goals', 'budgets', 'categories', 'payees'];
    for (const table of coreTables) {
      try {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN sync_status INTEGER DEFAULT 0;`);
      } catch(e) {}
    }

    const migrations = [
      "ALTER TABLE transactions ADD COLUMN category_app_icon TEXT;",
      "ALTER TABLE transactions ADD COLUMN product_link TEXT;",
      "ALTER TABLE transactions ADD COLUMN tid INTEGER DEFAULT 0;",
      "ALTER TABLE transactions ADD COLUMN created_at TEXT;",
      "ALTER TABLE transactions ADD COLUMN updated_at TEXT;",
      "ALTER TABLE transactions ADD COLUMN deleted INTEGER DEFAULT 0;",
      "ALTER TABLE categories ADD COLUMN icon TEXT;",
      "ALTER TABLE categories ADD COLUMN app_icon TEXT;",
      "ALTER TABLE categories ADD COLUMN user_id TEXT;",
      "ALTER TABLE payees ADD COLUMN logo TEXT;",
      "ALTER TABLE payees ADD COLUMN user_id TEXT;",
      "ALTER TABLE categories ADD COLUMN is_living_cost INTEGER DEFAULT 0;"
    ];

    for (const m of migrations) {
      try {
        await db.execAsync(m);
      } catch(e) {}
    }

    console.log("[DB] Creating indexes...");
    try {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sync_status ON transactions(sync_status);
        CREATE INDEX IF NOT EXISTS idx_transactions_catname ON transactions(category_name);
        CREATE INDEX IF NOT EXISTS idx_transactions_tid ON transactions(tid);
      `);
    } catch (e) {
      console.warn("[DB] Index creation warning:", e);
    }

    console.log("[DB] initDB completed successfully.");
  } catch (error) {
    console.error("[DB] initDB critical error:", error);
    throw error;
  }
};
