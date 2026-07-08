import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTransactionGroups,
  insertTransactionGroup,
  deleteTransactionGroupAsync,
} from '../db/queries';
import { syncGroups } from '../services/syncService';
import { pushLocalGroups } from '../services/sync/groupSync';
import { TransactionGroup } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { logger } from '../utils/logger';

const VIEW_MODE_KEY = (userId: string) => `@group_view_mode_${userId}`;
const LAST_SYNC_KEY = (userId: string) => `@last_sync_groups_${userId}`;

export const fetchGroupsData = async (
  userId: string,
): Promise<{
  groups: TransactionGroup[];
  viewMode: 'list' | 'grid';
  lastSynced: string | null;
}> => {
  let groups = await getTransactionGroups(userId);
  const viewMode = (await AsyncStorage.getItem(VIEW_MODE_KEY(userId))) as 'list' | 'grid' | null;
  const lastSynced = await AsyncStorage.getItem(LAST_SYNC_KEY(userId));

  // Trigger auto-sync if never synced or in wrong format
  if (!lastSynced || !lastSynced.includes('T')) {
    logger.info('[Groups] Missing or invalid sync history, triggering initial sync...');
    try {
      const result = await performGroupSync(userId);
      return {
        groups: result.groups,
        viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
        lastSynced: result.lastSynced,
      };
    } catch (err) {
      logger.error('[Groups] Auto-sync failed:', err);
    }
  }

  return {
    groups,
    viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
    lastSynced,
  };
};

export const saveGroupViewMode = async (userId: string, mode: 'list' | 'grid') => {
  await AsyncStorage.setItem(VIEW_MODE_KEY(userId), mode);
};

export const addGroup = async (userId: string, name: string, description?: string) => {
  const newGroup: TransactionGroup = {
    id: generateUUID(),
    name: name.trim(),
    description: description?.trim() || null,
    user_id: userId,
    sync_status: 1,
  };

  await insertTransactionGroup(newGroup, 1);

  // Background sync
  syncGroups(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Group sync failed', err));

  return newGroup;
};

export const deleteGroup = async (userId: string, groupId: string) => {
  await deleteTransactionGroupAsync(groupId, userId);

  // Background push/sync
  syncGroups(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Group deletion sync failed', err));
};

export const updateGroup = async (userId: string, group: TransactionGroup) => {
  const updatedGroup: TransactionGroup = {
    ...group,
    name: group.name.trim(),
    description: group.description?.trim() || null,
    sync_status: 1,
  };

  await insertTransactionGroup(updatedGroup, 1);

  // Background sync
  syncGroups(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Group update sync failed', err));

  return updatedGroup;
};

export const performGroupSync = async (userId: string) => {
  await syncGroups(userId);
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY(userId), now);
  const updated = await getTransactionGroups(userId);
  return { groups: updated, lastSynced: now };
};

export const backgroundPushGroups = (userId: string) => {
  pushLocalGroups(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('[Groups] Background push failed:', err));
};

export const filterAndSortGroups = (
  groups: TransactionGroup[],
  searchQuery: string,
  sortBy: 'name' | 'priority',
  sortAsc: boolean,
  isReordering: boolean,
): TransactionGroup[] => {
  let result = [...groups];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (g) => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q),
    );
  }

  if (isReordering) {
    result.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  } else {
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
