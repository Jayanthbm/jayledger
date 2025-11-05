// src/database/categories/categorySync.js

import { fromSqliteValue, toSqliteValue } from '../utils';

import { getDB } from '../db';
import { supabase } from '../../supabaseClient';

export async function syncCategories(userId) {
   const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

   if (error) {
      console.error('❌ Supabase fetch error:', error.message);
      return;
   }

   console.log(`⬇️ Syncing ${data.length} categories from Supabase`);

   if (!data.length) return;

   const db = getDB();
   if (!db) {
      console.error('❌ Database not initialized');
      return;
   }

   // ✅ Prepare batch UPSERT queries
   const batch = data.map((category) => ({
      query: `
      INSERT INTO categories (id, user_id, name, type, icon, app_icon, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        icon = excluded.icon,
        app_icon = excluded.app_icon,
        updated_at = datetime('now');
    `,
      params: [
         category.id,
         category.user_id,
         category.name,
         category.type,
         toSqliteValue(category.icon),
         toSqliteValue(category.app_icon),
      ],
   }));

   try {
      // ✅ Single batch execution — super fast
      const result = await db.executeBatch(batch);
      console.log(`✅ Synced ${result.rowsAffected} total changes.`);
   } catch (e) {
      console.error('❌ Error during batch sync:', e);
   }
}

// Push unsynced categories to Supabase
export async function pushUnsyncedCategories(userId) {
   const db = getDB();
   if (!db) return;

   try {
      const { rows } = await db.execute(
         'SELECT * FROM categories WHERE user_id = ? AND synced = false',
         [userId]
      );
      const unsynced = rows?._array ?? [];
      if (!unsynced.length) {
         console.log('✅ No unsynced categories to push');
         return;
      }

      console.log(`⬆️ Pushing ${unsynced.length} unsynced categories`);

      for (const category of unsynced) {
         try {
            const { error } = await supabase.from('categories').upsert({
               id: category.id,
               user_id: category.user_id,
               name: category.name,
               type: category.type,
               icon: fromSqliteValue(category.icon),
               app_icon: fromSqliteValue(category.app_icon),
               updated_at: new Date().toISOString(),
            });

            if (!error) {
               await db.execute('UPDATE categories SET synced = true WHERE id = ?', [
                  category.id,
               ]);
            } else {
               console.warn('⚠️ Supabase push error for category:', category.id, error.message);
            }
         } catch (err) {
            console.warn('⚠️ Failed to push category', category.id, err.message);
         }
      }

      console.log('✅ Push complete');
   } catch (error) {
      console.error('❌ Error pushing unsynced categories:', error);
   }
}

/**
 * Delete a category from Supabase by categoryId and userId
 */
export async function deleteCategoryFromSupabase(categoryId, userId) {
   if (!categoryId || !userId) {
      console.warn('⚠️ deleteCategoryFromSupabase missing parameters', {
         categoryId,
         userId,
      });
      return false;
   }

   try {
      const { error } = await supabase
         .from('categories')
         .delete()
         .eq('id', categoryId)
         .eq('user_id', userId); // ✅ Ensures the user owns this record

      if (error) {
         console.error('❌ Supabase delete error:', error.message);
         return false;
      }

      console.log(`✅ Deleted category ${categoryId} (user: ${userId}) from Supabase`);
      return true;
   } catch (e) {
      console.error('❌ Failed to delete category from Supabase:', e.message);
      return false;
   }
}