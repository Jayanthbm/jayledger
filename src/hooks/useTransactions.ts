import { useState, useCallback, useEffect } from 'react';
import { getTransactionsByDateRange } from '../db/transactionQueries';
import { Transaction } from '../models/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Hook for managing transaction data with filtering.
 */
export const useTransactions = (
  userId: string,
  initialStartDate?: string,
  initialEndDate?: string,
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTransactions = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const start = initialStartDate || format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const end = initialEndDate || format(endOfMonth(new Date()), 'yyyy-MM-dd');
        const data = await getTransactionsByDateRange(userId, start, end);
        if (active) setTransactions(data);
      } catch {
        if (active) setError('Failed to load transactions');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTransactions();
    return () => {
      active = false;
    };
  }, [userId, initialStartDate, initialEndDate]);

  const refresh = useCallback(async () => {
    const start = initialStartDate || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const end = initialEndDate || format(endOfMonth(new Date()), 'yyyy-MM-dd');
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getTransactionsByDateRange(userId, start, end);
      setTransactions(data);
    } catch {
      setError('Failed to refresh');
    } finally {
      setLoading(false);
    }
  }, [userId, initialStartDate, initialEndDate]);

  return {
    transactions,
    loading,
    error,
    refresh,
  };
};
