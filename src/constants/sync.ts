/**
 * Keys used for AsyncStorage.
 */
export const STORAGE_KEYS = {
  LAST_SYNC_TRANSACTIONS: '@last_sync_transactions_',
  LAST_SYNC_CATEGORIES: '@last_sync_categories_',
  LAST_SYNC_PAYEES: '@last_sync_payees_',
  LAST_SYNC_BUDGETS: '@last_sync_budgets_',
  LAST_SYNC_GOALS: '@last_sync_goals_',
  LAST_SYNC_QUICK_TRANSACTIONS: '@last_sync_quick_transactions_',
  LAST_SYNC_TRANSACTION_GROUPS: '@last_sync_transaction_groups_',
  LAST_SYNC_MASTER: '@last_sync_master_',
  THEME: '@theme',
  AUTH_SESSION: '@auth_session',
} as const;

/**
 * Sync configuration constants.
 */
export const SYNC_CONFIG = {
  BATCH_SIZE: 100,
  RETRY_ATTEMPTS: 3,
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;
