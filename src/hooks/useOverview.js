import { useState, useCallback, useEffect } from 'react';
import { useTransactions } from './useTransactions';
import dayjs from 'dayjs';

export function useOverview(userId) {
  const { getAllTransactions, performSync } = useTransactions(userId);

  // Flags
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  /** Overview values */
  const [overview, setOverview] = useState({
    remaining: 0,
    progressRemaining: 0,
    dailyLimit: 0,
    spentToday: 0,
    topCategories: [],
    monthIncome: 0,
    prevMonthIncome: 0,
    monthExpense: 0,
    prevMonthExpense: 0,
    yearIncome: 0,
    prevYearIncome: 0,
    yearExpense: 0,
    prevYearExpense: 0,
    netWorth: 0,
  });

  /** Loading flags */
  const [loading, setLoading] = useState({
    remaining: true,
    dailyLimit: true,
    topCategories: true,
    month: true,
    year: true,
    netWorth: true,
  });

  /** Set zero state */
  const setToZeroValues = () => {
    setOverview({
      remaining: 0,
      progressRemaining: 0,
      dailyLimit: 0,
      spentToday: 0,
      topCategories: [],
      monthIncome: 0,
      prevMonthIncome: 0,
      monthExpense: 0,
      prevMonthExpense: 0,
      yearIncome: 0,
      prevYearIncome: 0,
      yearExpense: 0,
      prevYearExpense: 0,
      netWorth: 0,
    });

    setLoading({
      remaining: false,
      dailyLimit: false,
      topCategories: false,
      month: false,
      year: false,
      netWorth: false,
    });
  };

  /** Main calculation logic */
  const calculateOverview = useCallback(async () => {
    try {
      const transactions = await getAllTransactions();
      // First time, no transactions → sync
      if (transactions.length === 0 && !hasSyncedOnce) {
        await performSync();
        setHasSyncedOnce(true);
        await calculateOverview();
        return;
      }

      // Transactions still empty → zero state
      if (transactions.length === 0 && hasSyncedOnce) {
        setToZeroValues();
        return;
      }

      // --------------------------------
      // REAL CALCULATIONS WILL GO HERE
      // --------------------------------

      setOverview({
        remaining: 40689,
        progressRemaining: 0.6,
        dailyLimit: 3129.94,
        spentToday: 200,
        topCategories: [
          { name: 'Loans', amount: 44998, percent: 49.21, color: '#4285F4' },
          { name: 'Insurance', amount: 17796, percent: 19.46, color: '#FBBC04' },
          { name: 'Other', amount: 28648.82, percent: 31.33, color: '#34A853' },
        ],
        monthIncome: 132132,
        prevMonthIncome: 143234,
        monthExpense: 91442.82,
        prevMonthExpense: 80000,
        yearIncome: 1362537,
        prevYearIncome: 4564456,
        yearExpense: 1000866.63,
        prevYearExpense: 2455545,
        netWorth: 636861,
      });

      setLoading({
        remaining: false,
        dailyLimit: false,
        topCategories: false,
        month: false,
        year: false,
        netWorth: false,
      });
    } catch (e) {
      console.log('calculateOverview error', e);
    }
  }, [getAllTransactions, performSync, hasSyncedOnce]);

  /** Run on mount */
  useEffect(() => {
    calculateOverview();
  }, [calculateOverview]);

  return {
    overview,
    loading,
    refresh: calculateOverview,
  };
}
