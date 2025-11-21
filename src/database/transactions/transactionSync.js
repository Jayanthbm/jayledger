// src/database/transactions/transactionSync.js

import { getDB } from '../db';
import { supabase } from '../../supabaseClient';
import { fromSqliteValue, toSqliteValue } from '../utils';

/**
 * Sync transactions from Supabase to local DB
 * @param {string} userId
 * @param {boolean} force - If true, sync all transactions. If false, sync from max updated_at.
 */
export async function syncTransactions(userId, force = false) {
  const db = getDB();
  if (!db) return;

  try {
    let lastCreatedAt = null;

    if (!force) {
      // Get max(created_at) from local DB
      const { rows } = await db.execute(
        'SELECT MAX(created_at) AS max_created FROM transactions WHERE user_id = ?',
        [userId],
      );

      if (rows?._array?.length > 0) {
        const rawMax = fromSqliteValue(rows._array[0].max_created); // <-- FIXED
        console.log('Raw created_at from DB:', rawMax, typeof rawMax);
        lastCreatedAt = rawMax;
      }
    }

    console.log(
      `🔄 Syncing transactions for user ${userId} (force: ${force}, lastCreatedAt: ${lastCreatedAt})`,
    );

    // Base query
    let baseQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (lastCreatedAt) {
      // Use gte, not gt — safer for equal timestamps
      baseQuery = baseQuery.gte('created_at', lastCreatedAt);
    }

    const BATCH_SIZE = 1000;
    let cursor = lastCreatedAt;

    while (true) {
      let query = baseQuery;

      if (cursor) {
        query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .gte('created_at', cursor) // <-- FIXED
          .limit(BATCH_SIZE);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase fetch error:', error.message);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) break;

      console.log(`⬇️ Downloading ${data.length} transactions`);

      const batch = data.map((t) => ({
        query: `
          INSERT INTO transactions (
            id, user_id, amount, transaction_timestamp,
            description, category_id, payee_id, type,
            synced, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            amount = excluded.amount,
            transaction_timestamp = excluded.transaction_timestamp,
            description = excluded.description,
            category_id = excluded.category_id,
            payee_id = excluded.payee_id,
            type = excluded.type,
            synced = true,
            updated_at = excluded.updated_at
        `,
        params: [
          t.id,
          t.user_id,
          t.amount,
          t.transaction_timestamp,
          toSqliteValue(t.description),
          toSqliteValue(t.category_id),
          toSqliteValue(t.payee_id),
          t.type,
          true,
          t.created_at, // <-- must store created_at
          t.updated_at,
        ],
      }));

      await db.executeBatch(batch);

      // Update cursor → last row’s created_at
      cursor = data[data.length - 1].created_at;

      // If fewer than batch size → done
      if (data.length < BATCH_SIZE) break;
    }

    console.log('✅ Transaction sync complete');
  } catch (e) {
    console.error('❌ Error during transaction sync:', e);
  }
}

/**
 * Push unsynced transactions to Supabase
 */
export async function pushUnsyncedTransactions(userId) {
  const db = getDB();
  if (!db) return;

  try {
    const { rows } = await db.execute(
      'SELECT * FROM transactions WHERE user_id = ? AND synced = false',
      [userId],
    );
    const unsynced = rows?._array ?? [];
    if (!unsynced.length) {
      console.log('✅ No unsynced transactions to push');
      return;
    }

    console.log(`⬆️ Pushing ${unsynced.length} unsynced transactions`);

    // Push in batches if needed, but for now loop is safer for error handling per item
    // Or use upsert with array if Supabase supports it well for large data.
    // Loop is safer to update local synced status individually.

    for (const t of unsynced) {
      try {
        const { error } = await supabase.from('transactions').upsert({
          id: t.id,
          user_id: t.user_id,
          amount: t.amount,
          transaction_timestamp: t.transaction_timestamp,
          description: t.description,
          category_id: t.category_id,
          payee_id: t.payee_id,
          type: t.type,
          updated_at: new Date().toISOString(), // Update timestamp on server push
        });

        if (!error) {
          await db.execute('UPDATE transactions SET synced = true WHERE id = ?', [t.id]);
        } else {
          console.warn('⚠️ Supabase push error for transaction:', t.id, error.message);
        }
      } catch (err) {
        console.warn('⚠️ Failed to push transaction', t.id, err.message);
      }
    }

    console.log('✅ Push complete');
  } catch (error) {
    console.error('❌ Error pushing unsynced transactions:', error);
  }
}

/**
 * Delete a transaction from Supabase
 */
export async function deleteTransactionFromSupabase(transactionId, userId) {
  if (!transactionId || !userId) {
    console.warn('⚠️ deleteTransactionFromSupabase missing parameters');
    return false;
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return false;
    }

    console.log(`✅ Deleted transaction ${transactionId} from Supabase`);
    return true;
  } catch (e) {
    console.error('❌ Failed to delete transaction from Supabase:', e.message);
    return false;
  }
}
