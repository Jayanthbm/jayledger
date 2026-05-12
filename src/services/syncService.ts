import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../db/database';
import { isOnline, syncLog } from './sync/baseSync';
import { pushLocalTransactions, syncTransactions } from './sync/transactionSync';
import { pushLocalCategories, syncCategories } from './sync/categorySync';
import { pushLocalBudgets, syncBudgets } from './sync/budgetSync';
import { pushLocalGoals, syncGoals } from './sync/goalSync';
import { pushLocalPayees, syncPayees } from './sync/payeeSync';
import { pushLocalQuickTransactions, syncQuickTransactions } from './sync/quickTransactionSync';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

export { isOnline };

/**
 * Pushes all unsynced local changes to Supabase across all entities.
 */
export const pushLocalChanges = async (userId: string) => {
  if (!(await isOnline())) return;

  syncLog('Coordinator', 'Checking for unsynced local data...');

  await pushLocalTransactions(userId);
  await pushLocalGoals(userId);
  await pushLocalBudgets(userId);
  await pushLocalCategories(userId);
  await pushLocalPayees(userId);
  await pushLocalQuickTransactions(userId);

  syncLog('Coordinator', 'Local data push complete.');
};

/**
 * Logic to check if a transaction sync is needed.
 * Kept here for convenience as it involves coordination between DB and Supabase.
 */
export const needsTransactionSync = async (userId: string) => {
  if (!(await isOnline())) return false;
  try {
    const db = getDb();
    const localMax = await db.getFirstAsync<{ max_tid: number }>(
      `SELECT MAX(tid) as max_tid FROM transactions WHERE user_id = '${userId}'`,
    );
    const maxLocalTid = localMax?.max_tid || 0;

    const { data: supabaseMax, error } = await supabase
      .from('transactions')
      .select('tid')
      .eq('user_id', userId)
      .order('tid', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('[Sync] Supabase error checking needsTransactionSync:', error);
      return false;
    }

    const maxSupabaseTid = supabaseMax?.[0]?.tid || 0;
    return maxLocalTid < maxSupabaseTid;
  } catch (error) {
    logger.error('[Sync] Error checking if transaction sync is needed:', error);
    return false;
  }
};

export const forceTransactionsSync = async (userId: string) => {
  return syncTransactions(userId, false);
};

// Re-exporting sync functions for backward compatibility
export {
  syncTransactions,
  syncGoals,
  syncBudgets,
  syncCategories,
  syncPayees,
  syncQuickTransactions,
};

let isSyncingData = false;

/**
 * Runs a full synchronization cycle across all entities.
 */
export const runFullSync = async (userId: string, onProgress?: (msg: string) => void) => {
  if (isSyncingData) return;
  isSyncingData = true;
  try {
    if (!(await isOnline())) {
      if (onProgress) onProgress('Offline');
      return;
    }
    syncLog('Coordinator', '*** runFullSync Initiation ***');
    logger.info(`[SyncMaster] Starting full sync for user: ${userId}`);

    if (onProgress) onProgress('Pushing local changes...');
    await pushLocalChanges(userId);

    if (onProgress) onProgress('Syncing Transactions');
    await forceTransactionsSync(userId);

    if (onProgress) onProgress('Syncing Goals');
    await syncGoals(userId);

    if (onProgress) onProgress('Syncing Budgets');
    await syncBudgets(userId);

    if (onProgress) onProgress('Syncing Categories');
    await syncCategories(userId);

    if (onProgress) onProgress('Syncing Payees');
    await syncPayees(userId);

    if (onProgress) onProgress('Syncing Quick Transactions');
    await syncQuickTransactions(userId);

    if (onProgress) onProgress('Finalizing');
    await AsyncStorage.setItem(`@last_sync_master_${userId}`, new Date().toISOString());
    syncLog('Coordinator', '*** Full Sync complete ***');
    logger.info(`[SyncMaster] Full sync completed for user: ${userId}`);
  } catch (error) {
    logger.error('[Sync:Coordinator] Full Sync error:', error);
    if (onProgress) onProgress('Error');
  } finally {
    isSyncingData = false;
  }
};
