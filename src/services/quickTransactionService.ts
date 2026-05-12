import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuickTransactions } from '../db/queries';
import { syncQuickTransactions } from '../services/syncService';
import { pushLocalQuickTransactions } from '../services/sync/quickTransactionSync';
import { QuickTransaction } from '../models/types';
import { logger } from '../utils/logger';

const VIEW_MODE_KEY = (userId: string) => `@quick_transaction_view_mode_${userId}`;
const LAST_SYNC_KEY = (userId: string) => `@last_sync_quick_transactions_${userId}`;

export const fetchQuickTransactionsData = async (
  userId: string,
): Promise<{
  quickTransactions: QuickTransaction[];
  viewMode: 'Card' | 'List';
  lastSynced: string | null;
}> => {
  const quickTransactions = await getQuickTransactions(userId);
  const viewMode = (await AsyncStorage.getItem(VIEW_MODE_KEY(userId))) as 'Card' | 'List' | null;
  const lastSynced = await AsyncStorage.getItem(LAST_SYNC_KEY(userId));

  // Trigger auto-sync if never synced
  if (!lastSynced || !lastSynced.includes('T')) {
    logger.info('[QuickTransactions] No sync history, triggering initial sync...');
    try {
      const result = await performQuickTransactionSync(userId);
      return {
        quickTransactions: result.quickTransactions,
        viewMode: viewMode === 'Card' || viewMode === 'List' ? viewMode : 'Card',
        lastSynced: result.lastSynced,
      };
    } catch (err) {
      logger.error('[QuickTransactions] Auto-sync failed:', err);
    }
  }

  return {
    quickTransactions,
    viewMode: viewMode === 'Card' || viewMode === 'List' ? viewMode : 'Card',
    lastSynced,
  };
};

export const saveQuickTransactionViewMode = async (userId: string, mode: 'Card' | 'List') => {
  await AsyncStorage.setItem(VIEW_MODE_KEY(userId), mode);
};

export const performQuickTransactionSync = async (userId: string) => {
  await syncQuickTransactions(userId);
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY(userId), now);
  const updated = await getQuickTransactions(userId);
  return { quickTransactions: updated, lastSynced: now };
};

/**
 * Fire-and-forget background push for local changes (e.g. after reorder or add).
 * Updates the last-synced timestamp on success.
 */
export const backgroundPushQuickTransactions = (userId: string) => {
  pushLocalQuickTransactions(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('[QuickTransactions] Background push failed:', err));
};
