import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { CategoryModel } from '../database/categories/categoryModel';
import {
  syncCategories,
  pushUnsyncedCategories,
  deleteCategoryFromSupabase,
} from '../database/categories/categorySync';

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  /** -----------------------------
   * Load all categories (local DB)
   * ----------------------------- */
  const getAllCategories = useCallback(async () => {
    try {
      const data = await CategoryModel.getAll(userId);
      setCategories(data);
      return data;
    } catch (e) {
      console.log('getAllCategories error:', e);
      return [];
    }
  }, [userId]);

  /** -----------------------------
   * Sync categories (cloud → local)
   * ----------------------------- */
  const reSync = useCallback(async () => {
    try {
      setLoading(true);
      await pushUnsyncedCategories(userId);
      await syncCategories(userId);
      await getAllCategories();
      setLoading(false);
    } catch (e) {
      console.log('reSync categories error:', e);
    }
  }, [userId, getAllCategories]);

  /** -----------------------------
   * Delete category locally + cloud
   * ----------------------------- */
  const deleteCategory = useCallback(
    async (id) => {
      try {
        const isOnline = (await NetInfo.fetch()).isConnected;

        // Delete locally first
        CategoryModel.delete(id);

        // If online, delete remotely
        if (isOnline) {
          await deleteCategoryFromSupabase(id, userId);
        }

        // Refresh local data
        await getAllCategories();
      } catch (e) {
        console.log('deleteCategory error:', e);
      }
    },
    [userId, getAllCategories],
  );

  /** -----------------------------
   * Insert a category
   * ----------------------------- */
  const insertCategory = useCallback(
    async (name, type, icon, app_icon) => {
      try {
        CategoryModel.insert(userId, name, type, icon, app_icon, false);

        const isOnline = (await NetInfo.fetch()).isConnected;
        if (isOnline) {
          await pushUnsyncedCategories(userId);
        }

        await getAllCategories();
      } catch (e) {
        console.log('insertCategory error:', e);
      }
    },
    [userId, getAllCategories],
  );

  /** -----------------------------
   * Update a category
   * ----------------------------- */
  const updateCategory = useCallback(
    async (category, name, type) => {
      try {
        CategoryModel.update(category.id, name, type, category.icon, category.app_icon, false);

        const isOnline = (await NetInfo.fetch()).isConnected;
        if (isOnline) {
          await pushUnsyncedCategories(userId);
        }

        await getAllCategories();
      } catch (e) {
        console.log('updateCategory error:', e);
      }
    },
    [userId, getAllCategories],
  );

  /** -----------------------------
   * Initial load on mount
   * ----------------------------- */
  useEffect(() => {
    (async () => {
      const data = await getAllCategories();

      // If empty → sync once
      if (!data.length && !hasSyncedOnce) {
        await reSync();
        setHasSyncedOnce(true);
      }

      setLoading(false);
    })();
  }, [getAllCategories, reSync, hasSyncedOnce]);

  return {
    loading,
    categories,
    refresh: getAllCategories,
    reSync,
    deleteCategory,
    insertCategory,
    updateCategory,
  };
}
