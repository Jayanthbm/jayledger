// src/databse/payees/payeeSync.js

import { fromSqliteValue, toSqliteValue } from '../utils';

import { getDB } from '../db';
import { supabase } from '../../supabaseClient';

export async function syncPayees(userId) {
  const { data, error } = await supabase.from('payees').select('*').eq('user_id', userId);

  if (error) {
    console.error('❌ Supabase fetch error:', error.message);
    return;
  }
  console.log(`⬇️ Syncing ${data.length} payees from Supabase`);

  if (!data.length) return;

  const db = getDB();
  if (!db) {
    console.error('❌ Database not initialized');
    return;
  }

  // ✅ Prepare batch UPSERT queries
  const batch = data.map((payee) => ({
    query: `
      INSERT INTO payees (id, user_id, name, logo,updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        logo = excluded.logo,
        updated_at = datetime('now');
    `,
    params: [payee.id, userId, payee.name, toSqliteValue(payee.logo)],
  }));

  try {
    const result = await db.executeBatch(batch);
    console.log(`✅ Synced ${result.rowsAffected} total changes.`);
  } catch (e) {
    console.error('❌ Error during batch sync:', e);
  }
}

// Push unsynced categories to Supabase

export async function pushUnsyncedPayees(userId) {
  const db = getDB();
  if (!db) return;

  try {
    const { rows } = await db.execute('SELECT * FROM payees WHERE user_id = ? AND synced = false', [
      userId,
    ]);
    const unsynced = rows?._array ?? [];
    if (!unsynced.length) {
      console.log('✅ No unsynced payees to push');
      return;
    }

    console.log(`⬆️ Pushing ${unsynced.length} unsynced payees`);
    for (const payee of unsynced) {
      try {
        const { error } = await supabase.from('payees').upsert({
          id: payee.id,
          user_id: payee.user_id,
          name: payee.name,
          logo: fromSqliteValue(payee.logo),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        console.log(`✅ Pushed payee ${payee.name}`);
      } catch (e) {
        console.error(`❌ Error pushing payee ${payee.name}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('❌ Error fetching unsynced payees:', e);
  }
}

// Delete payee from Supabase
export async function deletePayeeFromSupabase(payeeId, userId) {
  if (!payeeId || !userId) {
    console.warn('⚠️ deletePayeeFromSupabase missing parameters', { payeeId, userId });
    return false;
  }

  try {
    const { error } = await supabase
      .from('payees')
      .delete()
      .eq('id', payeeId)
      .eq('user_id', userId); // ✅ Ensures the user owns this record

    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return false;
    }

    console.log(`✅ Deleted payee ${payeeId} (user: ${userId}) from Supabase`);
    return true;
  } catch (e) {
    console.error('❌ Failed to delete payee from Supabase:', e.message);
    return false;
  }
}
