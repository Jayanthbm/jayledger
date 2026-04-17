import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategories, insertCategory } from '../db/queries';
import { syncCategories } from '../services/syncService';
import { Category } from '../models/types';
import { generateUUID } from '../utils/commonUtils';

const VIEW_MODE_KEY = (userId: string) => `@category_view_mode_${userId}`;

export const fetchCategoriesData = async (
  userId: string,
): Promise<{ categories: Category[]; viewMode: 'list' | 'grid' }> => {
  const categories = await getCategories(userId);
  const viewMode = await AsyncStorage.getItem(VIEW_MODE_KEY(userId));
  return {
    categories,
    viewMode: viewMode === 'list' || viewMode === 'grid' ? viewMode : 'grid',
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
  syncCategories(userId).catch((err) => console.error('Category sync failed', err));

  return newCategory;
};

export const performCategorySync = async (userId: string) => {
  await syncCategories(userId);
  return await getCategories(userId);
};
