import { useState, useEffect, useCallback, useMemo } from 'react';
import { endOfMonth } from 'date-fns';
import { useAuth } from '../store/AuthContext';
import { ReportItem, Transaction } from '../models/types';
import { fetchReportData, handleReportDrillDown, sortReportData } from '../services/reportService';
import { getMinTransactionDate } from '../db/queries';
import { logger } from '../utils/logger';

const currentYear = new Date().getFullYear();

export interface UseReportDataProps {
  reportType: string;
  initialType?: 'Expense' | 'Income';
}

export const useReportData = ({ reportType, initialType = 'Expense' }: UseReportDataProps) => {
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportItem[]>([]);
  const [type, setType] = useState<'Expense' | 'Income'>(initialType);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(currentYear.toString());
  const [minDate, setMinDate] = useState<Date>(new Date(currentYear, 0, 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [useFullPreviousPeriod, setUseFullPreviousPeriod] = useState(true);

  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  const [sortBy, setSortBy] = useState<'name' | 'amount'>('amount');
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);

  const maxDate = useMemo(() => endOfMonth(new Date()), []);
  const monthStr = (month + 1).toString().padStart(2, '0');
  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);
  const isYearly = ['yearlySummary', 'transactionsByYear', 'yearlyPayees'].includes(reportType);

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    const isCurrentYear = parseInt(year) === now.getFullYear();
    const isCurrentMonth = isCurrentYear && month === now.getMonth();
    return isYearly ? isCurrentYear : isCurrentMonth;
  }, [isYearly, year, month]);

  const summaryMetrics = useMemo(() => {
    if (!isSummary) return null;
    const incomeObj = data.find((d) => d.type?.toLowerCase() === 'income');
    const expenseObj = data.find((d) => d.type?.toLowerCase() === 'expense');

    const income = Number(incomeObj?.totalAmount || 0);
    const expense = Number(expenseObj?.totalAmount || 0);
    const saved = income - expense;
    const spentPercent = income > 0 ? (expense / income) * 100 : 0;

    const prevIncome = Number(incomeObj?.prevAmount || 0);
    const prevExpense = Number(expenseObj?.prevAmount || 0);
    const prevSaved = prevIncome - prevExpense;

    const incomeDiff = incomeObj?.diffPercentage || 0;
    const expenseDiff = expenseObj?.diffPercentage || 0;

    let savedDiff = 0;
    if (prevSaved !== 0) {
      savedDiff = ((saved - prevSaved) / Math.abs(prevSaved)) * 100;
    } else if (saved !== 0) {
      savedDiff = 100;
    }

    return {
      income,
      expense,
      saved,
      spentPercent,
      prevIncome,
      prevExpense,
      prevSaved,
      incomeDiff,
      expenseDiff,
      savedDiff,
    };
  }, [data, isSummary]);

  const sortedData = useMemo(() => {
    return sortReportData(data, searchQuery, sortBy, sortAsc);
  }, [data, searchQuery, sortBy, sortAsc]);

  const totalAmount = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + (item.amount || item.totalAmount || 0), 0);
  }, [sortedData]);

  const prevTotal = useMemo(() => {
    if (isSummary || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + (item.prevAmount || 0), 0);
  }, [data, isSummary]);

  const totalDiff = useMemo(() => {
    if (isSummary || data.length === 0 || reportType === 'payees' || reportType === 'categories')
      return 0;

    const hasPrev = data.some((item) => item.prevAmount !== undefined);
    if (!hasPrev) return 0;

    if (prevTotal > 0) {
      return ((totalAmount - prevTotal) / prevTotal) * 100;
    }
    return totalAmount > 0 ? 100 : 0;
  }, [data, totalAmount, isSummary, reportType, prevTotal]);

  const showTrends = useMemo(() => {
    if (isSummary) return true;
    const isOverview = reportType === 'payees' || reportType === 'categories';
    if (isOverview) return false;
    return data.some((item) => item.prevAmount !== undefined);
  }, [data, reportType, isSummary]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const result = await fetchReportData(
        session.user.id,
        reportType,
        type,
        monthStr,
        year,
        useFullPreviousPeriod,
      );
      setData(result);
    } catch (error) {
      logger.error('Report Load Error:', error);
    } finally {
      setLoading(false);
    }
  }, [session, reportType, monthStr, year, type, useFullPreviousPeriod]);

  const handleDrillDown = async (item: ReportItem) => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const txs = await handleReportDrillDown(
        session.user.id,
        reportType,
        item,
        type,
        monthStr,
        year,
      );
      setDrillDownData(txs);
      setDrillDownTitle(item.category_name || item.payee_name || item.name || 'Transactions');
      setShowDrillDown(true);
    } catch (e) {
      logger.error('Drilldown error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMinDate = async () => {
      if (session?.user?.id) {
        try {
          const d = await getMinTransactionDate(session.user.id);
          if (d) setMinDate(new Date(d));
        } catch (error) {
          logger.error('Error fetching min transaction date:', error);
        }
      }
    };
    fetchMinDate();
  }, [session]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    loading,
    data,
    type,
    setType,
    month,
    setMonth,
    year,
    setYear,
    minDate,
    maxDate,
    searchQuery,
    setSearchQuery,
    useFullPreviousPeriod,
    setUseFullPreviousPeriod,
    isCurrentPeriod,
    summaryMetrics,
    sortedData,
    totalAmount,
    prevTotal,
    totalDiff,
    showTrends,
    isSummary,
    isYearly,
    drillDownData,
    showDrillDown,
    setShowDrillDown,
    drillDownTitle,
    handleDrillDown,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    showSortPicker,
    setShowSortPicker,
    refresh,
  };
};
