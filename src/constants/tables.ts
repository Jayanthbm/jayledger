/**
 * Database table names.
 */
export const TABLES = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  PAYEES: 'payees',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  QUICK_TRANSACTIONS: 'quick_transactions',
  PROFILES: 'profiles',
  ATTACHMENTS: 'attachments',
  SYNC_LOG: 'sync_log',
} as const;

/**
 * Sync status values.
 */
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
} as const;
