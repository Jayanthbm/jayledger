export const CATEGORY_TABLE = `
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
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

export const PAYEE_INDEX = `
      CREATE INDEX IF NOT EXISTS idx_payees_user_name
      ON payees (user_id, name);
    `;
