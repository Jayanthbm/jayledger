// src/database/queries.js

export const CATEGORY_TABLE = `
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        app_icon TEXT,
        synced BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

export const CATEGORY_INDEX = `
      CREATE INDEX IF NOT EXISTS idx_categories_user_type
      ON categories (user_id, type);
    `;

export const PAYEE_TABLE = `
      CREATE TABLE IF NOT EXISTS payees (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        logo text null,
        synced BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

export const PAYEE_INDEX = `
      CREATE INDEX IF NOT EXISTS idx_payees_user_name
      ON payees (user_id, name);
    `;

export const TRANSACTION_TABLE = `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount REAL NOT NULL,
        transaction_timestamp TIMESTAMP NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        category_id TEXT,
        payee_id TEXT,
        type TEXT NOT NULL DEFAULT 'Expense',
        synced BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

export const TRANSACTION_INDEX = `
      CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp
      ON transactions (user_id, transaction_timestamp);

      CREATE INDEX IF NOT EXISTS idx_transactions_filters
      ON transactions (category_id, payee_id);
    `;
