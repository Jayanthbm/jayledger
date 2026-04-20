import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  fetchDashboardMetrics,
  calculateDailyLimit,
  calculatePayDayInfo,
  DashboardMetrics,
} from '../services/dashboardService';
import { logger } from '../utils/logger';
import { useAsyncOperation } from './useAsyncOperation';

export const useDashboardData = (userId: string | undefined) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    month: { income: 0, expense: 0 },
    prevMonthComp: { income: 0, expense: 0 },
    year: { income: 0, expense: 0 },
    prevYearComp: { income: 0, expense: 0 },
    netWorth: 0,
    spentToday: 0,
    topCategories: [],
  });

  const metricsRef = useRef(metrics);
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const fetchMetrics = useCallback(async () => {
    if (!userId) return metricsRef.current;
    return await fetchDashboardMetrics(userId);
  }, [userId]);

  const { execute: loadData, loading } = useAsyncOperation(fetchMetrics, {
    onSuccess: (data) => {
      setMetrics(data);
    },
    onError: (err) => {
      logger.error('Dashboard Data Hook Error:', err);
    },
  });

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (data) => {
      if (data.module === 'Dashboard') {
        loadData();
      }
    });
    return () => sub.remove();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userId, loadData]);

  const dailyLimitCalc = useMemo(() => calculateDailyLimit(metrics), [metrics]);
  const payDayInfo = useMemo(() => calculatePayDayInfo(), []);

  return {
    metrics,
    loading,
    loadData,
    dailyLimitCalc,
    payDayInfo,
  };
};
