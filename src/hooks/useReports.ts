import { useState, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';
import {
  getReportMonthlySummary,
  getReportSummaryByCategory,
  getReportSummaryByPayee,
} from '../db/reportQueries';

/**
 * Hook for managing report data and state.
 */
export const useReports = (
  userId: string,
  type: 'Income' | 'Expense',
  month: string,
  year: string,
) => {
  const [summary, setSummary] = useState<{ type: string; totalAmount: number }[]>([]);
  const [byCategory, setByCategory] = useState<unknown[]>([]);
  const [byPayee, setByPayee] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchReportData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [summaryData, categoryData, payeeData] = await Promise.all([
          getReportMonthlySummary(userId, month, year),
          getReportSummaryByCategory(userId, type, month, year),
          getReportSummaryByPayee(userId, type, month, year),
        ]);
        if (active) {
          setSummary(summaryData);
          setByCategory(categoryData);
          setByPayee(payeeData);
        }
      } catch (err) {
        logger.error('[useReports] Error fetching report data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReportData();
    return () => {
      active = false;
    };
  }, [userId, type, month, year]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [summaryData, categoryData, payeeData] = await Promise.all([
        getReportMonthlySummary(userId, month, year),
        getReportSummaryByCategory(userId, type, month, year),
        getReportSummaryByPayee(userId, type, month, year),
      ]);
      setSummary(summaryData);
      setByCategory(categoryData);
      setByPayee(payeeData);
    } finally {
      setLoading(false);
    }
  }, [userId, type, month, year]);

  return {
    summary,
    byCategory,
    byPayee,
    loading,
    refresh,
  };
};
