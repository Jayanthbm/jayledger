import { useCallback } from 'react';
import { TransactionModel } from '../database/transactions/transactionModel';
import {
  syncTransactions,
  pushUnsyncedTransactions,
} from '../database/transactions/transactionSync';

export function useTransactions(userId) {
  /** Get all transactions */
  const getAllTransactions = useCallback(async () => {
    try {
      return await TransactionModel.getAll(userId);
    } catch (e) {
      console.log('getAllTransactions error', e);
      return [];
    }
  }, [userId]);

  /** Sync transactions */
  const performSync = useCallback(async () => {
    try {
      await syncTransactions(userId);
    } catch (e) {
      console.log('performSync error', e);
    }
  }, [userId]);

  /** Push unsynced transactions */
  const pushUnsyncedTransactions = useCallback(async () => {
    try {
      await pushUnsyncedTransactions(userId);
    } catch (e) {
      console.log('pushUnsyncedTransactions error', e);
    }
  }, [userId]);

  return {
    getAllTransactions,
    performSync,
    pushUnsyncedTransactions,
  };
}
