import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategories, insertCategory } from '../db/queries';
import { syncCategories } from '../services/syncService';
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
