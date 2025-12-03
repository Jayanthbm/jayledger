// src/database/budgets/budgetSync.js

import { fromSqliteValue, toSqliteValue } from '../utils';

import { getDB } from '../db';
import { supabase } from '../../supabaseClient';

//Sync budgets from Supabase to local DB
export async function syncBudgets(userId) {
  const { data, error } = await supabase.from('budgets').select('*').eq('user_id', userId);

  if (error) {
    console.error('❌ Supabase fetch error:', error.message);
    return;
  }
  console.log(`⬇️ Syncing ${data.length} budgets from Supabase`);

  if (!data.length) return;

  const db = getDB();
  if (!db) {
    console.error('❌ Database not initialized');
    return;
  }

  // ✅ Prepare batch UPSERT queries
  const batch = data.map((budget) => ({
    query: `
      INSERT INTO budgets (id, user_id, name, amount, interval, start_date, categories,updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        amount = excluded.amount,
        interval = excluded.interval,
        start_date = excluded.start_date,
        categories = excluded.categories,
        updated_at = datetime('now');
    `,
    params: [
      budget.id,
      userId,
      budget.name,
      budget.amount,
      budget.interval,
      budget.start_date,
      budget.categories.join(','),
    ],
  }));

  // ✅ Execute batch UPSERT queries
  for (const { query, params } of batch) {
    const { rowsAffected } = db.execute(query, params);
    console.log(`✅ Synced budget ${budget.name}, rowsAffected: ${rowsAffected}`);
  }
}

//Push unsynced budgets to Supabase
export async function pushUnsyncedBudgets(userId) {
  const db = getDB();
  if (!db) return;

  try {
    const { rows } = await db.execute(
      'SELECT * FROM budgets WHERE user_id = ? AND synced = false',
      [userId],
    );
    const unsynced = rows?._array ?? [];
    if (!unsynced.length) {
      console.log('✅ No unsynced budgets to push');
      return;
    }

    console.log(`⬆️ Pushing ${unsynced.length} unsynced budgets`);

    for (const budget of unsynced) {
      try {
        // Need to convert categories to array for supabase , supabase stores as text[] in db but local db stores as comma separated string
        const { error } = await supabase.from('budgets').upsert({
          id: budget.id,
          user_id: budget.user_id,
          name: budget.name,
          amount: budget.amount,
          interval: budget.interval,
          start_date: budget.start_date,
          categories: budget.categories.split(','),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        console.log(`✅ Pushed budget ${budget.name}`);
      } catch (e) {
        console.error(`❌ Error pushing budget ${budget.name}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('❌ Error pushing unsynced budgets:', e);
  }
}

// Delete budget from Supabase
export async function deleteBudgetFromSupabase(budgetId, userId) {
  if (!budgetId || !userId) {
    console.warn('⚠️ deleteBudgetFromSupabase missing parameters');
    return false;
  }

  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId); // ✅ Ensures the user owns this record

    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return false;
    }

    console.log(`✅ Deleted budget ${budgetId} from Supabase`);
    return true;
  } catch (e) {
    console.error('❌ Failed to delete budget from Supabase:', e.message);
    return false;
  }
}
