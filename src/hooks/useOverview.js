import { useState, useCallback, useEffect } from 'react';
import { useTransactions } from './useTransactions';
import dayjs from 'dayjs';
import { useCategories } from './useCategories';

export function useOverview(userId) {
  const { getAllTransactions, performSync } = useTransactions(userId);
  const { categories } = useCategories(userId);

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

      // --------------------------------------
      // REAL CALCULATIONS START
      // --------------------------------------

      const now = dayjs();

      // ---- Basic helpers ----
      const isSameDay = (t) => dayjs(t.transaction_timestamp).isSame(now, 'day');
      const isSameMonth = (t) => dayjs(t.transaction_timestamp).isSame(now, 'month');
      const isPrevMonth = (t) =>
        dayjs(t.transaction_timestamp).isSame(now.subtract(1, 'month'), 'month');
      const isSameYear = (t) => dayjs(t.transaction_timestamp).isSame(now, 'year');
      const isPrevYear = (t) =>
        dayjs(t.transaction_timestamp).isSame(now.subtract(1, 'year'), 'year');

      // ---- Spend today ----
      const spentToday = transactions
        .filter((t) => t.type === 'Expense' && isSameDay(t))
        .reduce((sum, t) => sum + t.amount, 0);

      // ---- Current month income/expense ----
      const monthIncome = transactions
        .filter((t) => t.type === 'Income' && isSameMonth(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = transactions
        .filter((t) => t.type === 'Expense' && isSameMonth(t))
        .reduce((sum, t) => sum + t.amount, 0);

      // ---- Previous month income/expense ----
      const prevMonthIncome = transactions
        .filter((t) => t.type === 'Income' && isPrevMonth(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const prevMonthExpense = transactions
        .filter((t) => t.type === 'Expense' && isPrevMonth(t))
        .reduce((sum, t) => sum + t.amount, 0);

      // ---- Year income/expense ----
      const yearIncome = transactions
        .filter((t) => t.type === 'Income' && isSameYear(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const yearExpense = transactions
        .filter((t) => t.type === 'Expense' && isSameYear(t))
        .reduce((sum, t) => sum + t.amount, 0);

      // ---- Previous year ----
      const prevYearIncome = transactions
        .filter((t) => t.type === 'Income' && isPrevYear(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const prevYearExpense = transactions
        .filter((t) => t.type === 'Expense' && isPrevYear(t))
        .reduce((sum, t) => sum + t.amount, 0);

      // ---- Remaining for month ----
      const remaining = monthIncome - monthExpense;

      // ---- Progress for remaining ----
      // progress = spent / income
      const progressRemaining = monthIncome === 0 ? 0 : monthExpense / monthIncome;

      // ---- Days remaining including today ----
      const endOfMonth = now.endOf('month');
      const daysRemaining = endOfMonth.diff(now, 'day') + 1;

      // ---- Daily Limit ----
      // dailyLimit = (remaining + spentToday) / remaining days
      const dailyLimit = daysRemaining > 0 ? (remaining + spentToday) / daysRemaining : 0;

      // ---- Net Worth ----
      // total income - total expense (all time)
      const totalIncome = transactions
        .filter((t) => t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter((t) => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netWorth = totalIncome - totalExpense;

      // ---- TOP CATEGORIES: Top 2 + Others ----

      // Map category totals for this MONTH
      const categoryTotals = {};

      transactions
        .filter((t) => t.type === 'Expense' && isSameMonth(t))
        .forEach((t) => {
          categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + t.amount;
        });

      // Convert to array with names
      const categoryData = Object.entries(categoryTotals).map(([id, amount]) => {
        const cat = categories.find((c) => c.id === id);
        return {
          name: cat?.name || 'Unknown',
          amount,
          color: cat?.color || '#4285F4',
        };
      });

      // Sort by amount DESC
      categoryData.sort((a, b) => b.amount - a.amount);

      // Take top 2
      const topTwo = categoryData.slice(0, 2);

      // Sum rest as "Others"
      const othersAmount = categoryData.slice(2).reduce((sum, c) => sum + c.amount, 0);

      if (othersAmount > 0) {
        topTwo.push({
          name: 'Other',
          amount: othersAmount,
          color: '#34A853',
        });
      }

      // Calculate percentages
      const totalCategoryAmount = categoryData.reduce((sum, c) => sum + c.amount, 0);

      const topCategories = topTwo.map((item) => ({
        ...item,
        percent:
          totalCategoryAmount === 0
            ? 0
            : Number(((item.amount / totalCategoryAmount) * 100).toFixed(2)),
      }));

      // --------------------------------------
      // UPDATE STATE
      // --------------------------------------

      setOverview({
        remaining,
        progressRemaining,
        dailyLimit,
        spentToday,
        topCategories,
        monthIncome,
        prevMonthIncome,
        monthExpense,
        prevMonthExpense,
        yearIncome,
        prevYearIncome,
        yearExpense,
        prevYearExpense,
        netWorth,
      });

      // mark all loading false:
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
