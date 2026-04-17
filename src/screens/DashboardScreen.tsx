import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { format } from 'date-fns';
import { DeviceEventEmitter } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  runFullSync,
  isOnline,
  needsTransactionSync,
  syncTransactions,
} from '../services/syncService';
import { getRelativeTime } from '../utils/dateUtils';
import { DashboardRemainingCard } from '../components/dashboard/DashboardRemainingCard';
import { DashboardDailyLimit } from '../components/dashboard/DashboardDailyLimit';
import { DashboardPayDay } from '../components/dashboard/DashboardPayDay';
import { DashboardSummaryCard } from '../components/dashboard/DashboardSummaryCard';
import { DashboardTopCategories } from '../components/dashboard/DashboardTopCategories';
import { DashboardNetWorth } from '../components/dashboard/DashboardNetWorth';
import { DashboardSyncModal } from '../components/dashboard/DashboardSyncModal';
import {
  fetchDashboardMetrics,
  calculateDailyLimit,
  calculatePayDayInfo,
  DashboardMetrics,
} from '../services/dashboardService';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>(); // useNavigation often requires complex typing

  const [loading, setLoading] = useState(true);
  const loadingLock = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    month: { income: 0, expense: 0 },
    prevMonthComp: { income: 0, expense: 0 },
    year: { income: 0, expense: 0 },
    prevYearComp: { income: 0, expense: 0 },
    netWorth: 0,
    spentToday: 0,
    topCategories: [],
  });

  // First Sync Logic
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Syncing Transactions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    if (loadingLock.current) return;

    const loadTimeout = setTimeout(() => {
      console.warn('Dashboard: loadData timed out! Forcing loading false.');
      setLoading(false);
      loadingLock.current = false;
    }, 5000);

    console.log('Dashboard: Starting loadData...');
    loadingLock.current = true;
    setLoading(true);

    try {
      const data = await fetchDashboardMetrics(session.user.id);
      setMetrics(data);
    } catch (error) {
      console.error('Dashboard Load Error:', error);
    } finally {
      clearTimeout(loadTimeout);
      loadingLock.current = false;
      setLoading(false);
    }
  }, [session]);

  const handleInitialSync = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const online = await isOnline();
      if (!online) {
        setSyncError('Please connect to the internet to sync your data.');
        setIsSyncing(false);
        return;
      }

      await runFullSync(session.user.id, (msg) => {
        if (msg === 'Offline') {
          setSyncError('Internet connection lost.');
        } else if (msg === 'Error') {
          setSyncError('An error occurred during sync. Please try again.');
        } else {
          setSyncStatus(msg);
        }
      });

      // After sync, verify if successful
      const check = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);
      if (check) {
        setShowSyncModal(false);
        loadData();
      }
    } catch {
      setSyncError('Sync failed. Please check your connection.');
    } finally {
      setIsSyncing(false);
    }
  }, [session, loadData]);

  const checkSyncStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    const lastMasterSync = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);

    if (!lastMasterSync) {
      setShowSyncModal(true);
      await handleInitialSync();
    } else {
      // Check if partial sync is needed
      const needsPartial = await needsTransactionSync(session.user.id);
      if (needsPartial) {
        setIsSyncing(true);
        await syncTransactions(session.user.id, true);
        setIsSyncing(false);
        loadData();
      }
    }

    const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
    if (lastTxSync) {
      setLastSyncTime(getRelativeTime(parseInt(lastTxSync)));
    }
  }, [session, loadData, handleInitialSync]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (data) => {
      if (data.module === 'Dashboard') {
        setTimeout(() => {
          loadData();
        }, 0);
      }
    });
    return () => sub.remove();
  }, [loadData]);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncTransactions(session.user.id, true);
      const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
      if (lastTxSync) {
        setLastSyncTime(getRelativeTime(parseInt(lastTxSync)));
      }
      loadData();
    } catch (e) {
      console.error('Manual sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing, loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={scrollToTop}
            style={styles.headerTitleContainer}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
            {lastSyncTime ? (
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Synced: {lastSyncTime}
              </Text>
            ) : null}
          </TouchableOpacity>
        ),
        headerTitleAlign: 'left',
        headerRight: () => (
          <TouchableOpacity
            onPress={handleManualSync}
            style={styles.headerRightBtn}
            disabled={isSyncing}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons name="refresh" size={24} color={colors.text} />
            )}
          </TouchableOpacity>
        ),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [
    navigation,
    isSyncing,
    colors.text,
    colors.textSecondary,
    colors.primary,
    lastSyncTime,
    handleManualSync,
    scrollToTop,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
      checkSyncStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData, checkSyncStatus]);

  const dailyLimitCalc = useMemo(() => calculateDailyLimit(metrics), [metrics]);

  const payDayInfo = useMemo(() => calculatePayDayInfo(), []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardDailyLimit
        dailyLimitCalc={dailyLimitCalc}
        navigation={navigation}
        colors={colors}
      />

      <DashboardRemainingCard
        monthIncome={metrics.month.income}
        monthExpense={metrics.month.expense}
        colors={colors}
      />

      <DashboardPayDay
        payDayInfo={payDayInfo}
        isDark={isDark}
        navigation={navigation}
        colors={colors}
      />

      <DashboardTopCategories
        topCategories={metrics.topCategories}
        totalExpense={metrics.month.expense}
        navigation={navigation}
        colors={colors}
      />

      <DashboardSummaryCard
        title="THIS MONTH"
        subtitle={format(new Date(), 'MMMM')}
        income={metrics.month.income}
        expense={metrics.month.expense}
        prevIncome={metrics.prevMonthComp.income}
        prevExpense={metrics.prevMonthComp.expense}
        onPress={() =>
          navigation.navigate('ReportDetail', {
            reportType: 'monthlySummary',
            title: 'Monthly Summary',
          })
        }
        colors={colors}
      />

      <DashboardSummaryCard
        title="THIS YEAR"
        subtitle={format(new Date(), 'yyyy')}
        income={metrics.year.income}
        expense={metrics.year.expense}
        prevIncome={metrics.prevYearComp.income}
        prevExpense={metrics.prevYearComp.expense}
        onPress={() =>
          navigation.navigate('ReportDetail', {
            reportType: 'yearlySummary',
            title: 'Yearly Summary',
          })
        }
        colors={colors}
      />

      <DashboardNetWorth netWorth={metrics.netWorth} colors={colors} />

      <DashboardSyncModal
        visible={showSyncModal}
        onClose={() => {}}
        syncError={syncError}
        syncStatus={syncStatus}
        onRetry={handleInitialSync}
        colors={colors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 10,
  },
  headerRightBtn: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
