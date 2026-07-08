import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategories, insertCategory } from '../db/queries';
import { syncCategories } from '../services/syncService';
import { pushLocalCategories } from '../services/sync/categorySync';
import { Category } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { logger } from '../utils/logger';

const VIEW_MODE_KEY = (userId: string) => `@category_view_mode_${userId}`;
const LAST_SYNC_KEY = (userId: string) => `@last_sync_categories_${userId}`;

export const fetchCategoriesData = async (
  userId: string,
): Promise<{ categories: Category[]; viewMode: 'list' | 'grid'; lastSynced: string | null }> => {
  let categories = await getCategories(userId);
  const viewMode = (await AsyncStorage.getItem(VIEW_MODE_KEY(userId))) as 'list' | 'grid' | null;
  const lastSynced = await AsyncStorage.getItem(LAST_SYNC_KEY(userId));

  // Trigger auto-sync if never synced or in wrong format
  if (!lastSynced || !lastSynced.includes('T')) {
    logger.info('[Categories] Missing or invalid sync history, triggering initial sync...');
    try {
      const result = await performCategorySync(userId);
      return {
        categories: result.categories,
        viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
        lastSynced: result.lastSynced,
      };
    } catch (err) {
      logger.error('[Categories] Auto-sync failed:', err);
    }
  }

  return {
    categories,
    viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
    lastSynced,
  };
};

export const saveCategoryViewMode = async (userId: string, mode: 'list' | 'grid') => {
  await AsyncStorage.setItem(VIEW_MODE_KEY(userId), mode);
};

export const addCategory = async (
  userId: string,
  name: string,
  type: 'Expense' | 'Income',
  appIcon: string,
) => {
  const newCategory: Category = {
    id: generateUUID(),
    name: name.trim(),
    type,
    icon: '', // legacy
    app_icon: appIcon.trim() || 'category',
    user_id: userId,
  };

  await insertCategory(newCategory);

  // Background sync
  syncCategories(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('Category sync failed', err));

  return newCategory;
};

export const performCategorySync = async (userId: string) => {
  await syncCategories(userId);
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_KEY(userId), now);
  const updated = await getCategories(userId);
  return { categories: updated, lastSynced: now };
};

export const backgroundPushCategories = (userId: string) => {
  pushLocalCategories(userId)
    .then(() => AsyncStorage.setItem(LAST_SYNC_KEY(userId), new Date().toISOString()))
    .catch((err) => logger.error('[Categories] Background push failed:', err));
};

export const filterAndSortCategories = (
  categories: Category[],
  activeTab: 'Expense' | 'Income',
  searchQuery: string,
  sortBy: 'name' | 'priority',
  sortAsc: boolean,
  isReordering: boolean,
): Category[] => {
  let result = categories.filter((c) => c.type === activeTab);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(q));
  }

  if (isReordering) {
    // When reordering, sort by priority only
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
