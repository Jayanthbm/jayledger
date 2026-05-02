import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPayees, insertPayee } from '../db/queries';
import { syncPayees } from '../services/syncService';
import { pushLocalPayees } from '../services/sync/payeeSync';
import { Payee } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { logger } from '../utils/logger';

const VIEW_MODE_KEY = (userId: string) => `@payee_view_mode_${userId}`;
const LAST_SYNC_KEY = (userId: string) => `@last_sync_payees_${userId}`;

export const fetchPayeesData = async (
  userId: string,
): Promise<{ payees: Payee[]; viewMode: 'list' | 'grid'; lastSynced: string | null }> => {
  let payees = await getPayees(userId);
  const viewMode = (await AsyncStorage.getItem(VIEW_MODE_KEY(userId))) as 'list' | 'grid' | null;
  const lastSynced = await AsyncStorage.getItem(LAST_SYNC_KEY(userId));

  // Trigger auto-sync if never synced or in wrong format
  if (!lastSynced || !lastSynced.includes('T')) {
    logger.info('[Payees] Missing or invalid sync history, triggering initial sync...');
    try {
      const result = await performPayeeSync(userId);
      return {
        payees: result.payees,
        viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
        lastSynced: result.lastSynced,
      };
    } catch (err) {
      logger.error('[Payees] Auto-sync failed:', err);
    }
  }

  return {
    payees,
    viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
    lastSynced,
  };
};

export const savePayeeViewMode = async (userId: string, mode: 'list' | 'grid') => {
  await AsyncStorage.setItem(VIEW_MODE_KEY(userId), mode);
};

export const addPayee = async (userId: string, name: string, logo: string) => {
  const newPayee: Payee = {
    id: generateUUID(),
    name: name.trim(),
    logo: logo.trim() || '',
    user_id: userId,
  };

  await insertPayee(newPayee);

  // Background sync
  syncPayees(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Payee sync failed', err));

  return newPayee;
};

export const performPayeeSync = async (userId: string) => {
  await syncPayees(userId);
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY(userId), now);
  const updated = await getPayees(userId);
  return { payees: updated, lastSynced: now };
};

export const backgroundPushPayees = (userId: string) => {
  pushLocalPayees(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('[Payees] Background push failed:', err));
};

export const filterAndSortPayees = (
  payees: Payee[],
  searchQuery: string,
  sortBy: 'name' | 'priority',
  sortAsc: boolean,
  isReordering: boolean,
): Payee[] => {
  let result = [...payees];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (isReordering) {
    result.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  } else {
    // Normal mode: sort by selected mode
    if (sortBy === 'priority') {
      result.sort((a, b) => {
        const cmp = (a.priority || 0) - (b.priority || 0);
        return sortAsc ? cmp : -cmp;
      });
    } else {
      result.sort((a, b) => {
        const cmp = a.name.localeCompare(b.name);
        return sortAsc ? cmp : -cmp;
      });
    }
  }

  return result;
};
