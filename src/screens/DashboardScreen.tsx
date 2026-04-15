import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Modal, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { 
  getIncomeExpenseSummary, 
  getTransactionsByCategoryForExpense, 
  getNetWorth, 
  getSpentToday 
} from '../db/queries';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, differenceInDays, addMonths, getDaysInMonth } from 'date-fns';
import { DeviceEventEmitter } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runFullSync, isOnline } from '../services/syncService';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const loadingLock = useRef(false);
  const [metrics, setMetrics] = useState({
    month: { income: 0, expense: 0 },
    year: { income: 0, expense: 0 },
    netWorth: 0,
    spentToday: 0,
    topCategories: [] as any[],
  });

  // First Sync Logic
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Syncing Transactions');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const checkSyncStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    const lastSync = await AsyncStorage.getItem(`@last_sync_master_${session.user.id}`);
    if (!lastSync) {
      setShowSyncModal(true);
      handleInitialSync();
    }
  }, [session?.user?.id]);

  const handleInitialSync = async () => {
    if (!session?.user?.id || isSyncing) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const online = await isOnline();
      if (!online) {
        setSyncError('Please connect to the internet to sync your data.');
        setIsSyncing(false);
        return;
      }

      await runFullSync(session.user.id, true, (msg) => {
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
    } catch (e) {
      setSyncError('Sync failed. Please check your connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    if (loadingLock.current) return;
    
    const loadTimeout = setTimeout(() => {
      console.warn("Dashboard: loadData timed out! Forcing loading false.");
      setLoading(false);
      loadingLock.current = false;
    }, 5000);

    console.log("Dashboard: Starting loadData...");
    loadingLock.current = true;
    setLoading(true);

    try {
      const today = new Date();
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');
      const todayStr = format(today, 'yyyy-MM-dd');

      const monthSum = await getIncomeExpenseSummary(session.user.id, monthStart, monthEnd);
      const yearSum = await getIncomeExpenseSummary(session.user.id, yearStart, yearEnd);
      const topCats = await getTransactionsByCategoryForExpense(session.user.id, monthStart, monthEnd);
      const totalNW = await getNetWorth(session.user.id);
      const todayExp = await getSpentToday(session.user.id, todayStr);

      const processSummary = (summary: any[]) => {
        if (!Array.isArray(summary)) return { income: 0, expense: 0 };
        let inc = 0, exp = 0;
        summary.forEach(s => {
          if (s.type === 'Income') inc = s.totalAmount || 0;
          if (s.type === 'Expense') exp = s.totalAmount || 0;
        });
        return { income: inc, expense: exp };
      };

      setMetrics({
        month: processSummary(monthSum),
        year: processSummary(yearSum),
        topCategories: Array.isArray(topCats) ? topCats.slice(0, 3) : [],
        netWorth: totalNW || 0,
        spentToday: todayExp || 0
      });
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      clearTimeout(loadTimeout);
      loadingLock.current = false;
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('module_refreshed', (data) => {
      if (data.module === 'Dashboard') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleManualSync} 
          style={{ paddingRight: 16, justifyContent: 'center', alignItems: 'center' }}
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
  }, [navigation, isSyncing, colors.text, colors.primary]);

  const handleManualSync = async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await runFullSync(session.user.id, true);
      loadData();
    } catch (e) {
      console.error("Manual sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkSyncStatus();
    loadData();
  }, [loadData, checkSyncStatus]);

  const dailyLimitCalc = useMemo(() => {
    const today = new Date();
    const monthEnd = endOfMonth(today);
    const remainingDays = differenceInDays(monthEnd, today) + 1;
    const balance = metrics.month.income - metrics.month.expense + metrics.spentToday;
    const limit = remainingDays > 0 ? balance / remainingDays : 0;
    const remainingToday = limit - metrics.spentToday;
    
    return {
      limit: Math.max(0, limit),
      spentToday: metrics.spentToday,
      remainingToday,
    };
  }, [metrics]);

  const payDayInfo = useMemo(() => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(today);
    const currentDay = today.getDate();
    return {
      daysInMonth,
      currentDay,
      remaining: daysInMonth - currentDay + 1,
      nextMonth: format(addMonths(today, 1), 'MMM 01')
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* 1. Remaining For Period */}
      <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>REMAINING FOR PERIOD</Text>
        </View>
        <Text style={[styles.mainAmount, { color: colors.text }]}>₹{(metrics.month.income - metrics.month.expense).toLocaleString()}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { 
            width: `${Math.min(100, (metrics.month.expense / (metrics.month.income || 1)) * 100)}%`,
            backgroundColor: colors.primary 
          }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {((metrics.month.expense / (metrics.month.income || 1)) * 100).toFixed(0)}% Spent
        </Text>
      </View>

      {/* 2. Daily Limit -> One Row */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('DailyLimitDetail')}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="speed" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>DAILY LIMIT</Text>
        </View>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>REMAINING</Text>
            <Text style={[styles.rowValue, { color: dailyLimitCalc.remainingToday >= 0 ? colors.success : colors.danger }]}>
              ₹{Math.abs(dailyLimitCalc.remainingToday).toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>SPENT</Text>
            <Text style={[styles.rowValue, { color: colors.danger }]}>₹{dailyLimitCalc.spentToday.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 3. Pay Day -> One Row with Dots & Circular Progress */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('CalendarView')}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="event" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>PAY DAY</Text>
        </View>
        <View style={styles.rowBetween}>
          <View style={styles.payDayMain}>
             <Text style={[styles.rowLabel, { color: colors.textSecondary, marginBottom: 12 }]}>{payDayInfo.nextMonth}</Text>
             <View style={styles.dotGrid}>
                {Array.from({ length: payDayInfo.daysInMonth }).map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.dot, 
                      { backgroundColor: (i + 1) < payDayInfo.currentDay ? (isDark ? '#374151' : '#E5E7EB') : colors.primary }
                    ]} 
                  />
                ))}
             </View>
          </View>

          <View style={styles.circularContainer}>
             <View style={[styles.progressCircle, { 
                borderColor: colors.border,
                borderTopColor: colors.primary,
                borderRightColor: (30 - payDayInfo.remaining) > 7 ? colors.primary : colors.border,
                borderBottomColor: (30 - payDayInfo.remaining) > 15 ? colors.primary : colors.border,
                borderLeftColor: (30 - payDayInfo.remaining) > 22 ? colors.primary : colors.border,
                transform: [{ rotate: '0deg' }]
             }]}>
                <View style={[styles.progressInner, { 
                  backgroundColor: colors.primary + '08',
                }]}>
                  <Text style={[styles.progressText, { color: colors.text }]}>{payDayInfo.remaining}</Text>
                  <Text style={[styles.progressSub, { color: colors.textSecondary }]}>DAYS</Text>
                </View>
             </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* 4. This Month -> One Row with Circular Progress */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>THIS MONTH</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{format(new Date(), 'MMMM')}</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.rowValue, { color: colors.danger }]}>₹{metrics.month.expense.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>INCOME</Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>₹{metrics.month.income.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.circularContainer}>
             <View style={[styles.progressCircle, { 
                borderColor: colors.border,
                borderTopColor: colors.danger,
                borderRightColor: (metrics.month.expense / (metrics.month.income || 1)) > 0.25 ? colors.danger : colors.border,
                borderBottomColor: (metrics.month.expense / (metrics.month.income || 1)) > 0.5 ? colors.danger : colors.border,
                borderLeftColor: (metrics.month.expense / (metrics.month.income || 1)) > 0.75 ? colors.danger : colors.border,
             }]}>
                <View style={[styles.progressInner, { backgroundColor: colors.danger + '05' }]}>
                  <Text style={[styles.progressText, { color: colors.text, fontSize: 16 }]}>
                    {((metrics.month.expense / (metrics.month.income || 1)) * 100).toFixed(0)}%
                  </Text>
                  <Text style={[styles.progressSub, { color: colors.textSecondary }]}>USED</Text>
                </View>
             </View>
          </View>
        </View>
      </View>

      {/* 5. Top Categories */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="pie-chart" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TOP CATEGORIES</Text>
        </View>
        {metrics.topCategories.length > 0 ? metrics.topCategories.map((cat, idx) => (
          <View key={cat.category_name} style={styles.catRow}>
            <View style={styles.catInfo}>
              <Text style={[styles.catName, { color: colors.text }]}>{cat.category_name}</Text>
              <Text style={[styles.catAmt, { color: colors.textSecondary }]}>₹{cat.totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.catProgressBg}>
              <View style={[styles.catProgressFill, { 
                width: `${Math.min(100, (cat.totalAmount / (metrics.month.expense || 1)) * 100)}%`,
                backgroundColor: idx === 0 ? colors.primary : idx === 1 ? colors.textSecondary : colors.border
              }]} />
            </View>
          </View>
        )) : (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 10 }}>No expenses yet</Text>
        )}
      </View>

      {/* 6. This Year -> One Row with Circular Progress */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="event-note" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>THIS YEAR</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{format(new Date(), 'yyyy')}</Text>
          </View>
        </View>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.rowValue, { color: colors.danger }]}>₹{metrics.year.expense.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>INCOME</Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>₹{metrics.year.income.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.circularContainer}>
             <View style={[styles.progressCircle, { 
                borderColor: colors.border,
                borderTopColor: colors.danger,
                borderRightColor: (metrics.year.expense / (metrics.year.income || 1)) > 0.25 ? colors.danger : colors.border,
                borderBottomColor: (metrics.year.expense / (metrics.year.income || 1)) > 0.5 ? colors.danger : colors.border,
                borderLeftColor: (metrics.year.expense / (metrics.year.income || 1)) > 0.75 ? colors.danger : colors.border,
             }]}>
                <View style={[styles.progressInner, { backgroundColor: colors.danger + '05' }]}>
                  <Text style={[styles.progressText, { color: colors.text, fontSize: 16 }]}>
                    {((metrics.year.expense / (metrics.year.income || 1)) * 100).toFixed(0)}%
                  </Text>
                  <Text style={[styles.progressSub, { color: colors.textSecondary }]}>USED</Text>
                </View>
             </View>
          </View>
        </View>
      </View>

      {/* 7. Net Worth */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 40 }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="stars" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>NET WORTH</Text>
        </View>
        <Text style={[styles.rowValue, { color: metrics.netWorth >= 0 ? colors.success : colors.danger, fontSize: 32, textAlign: 'center' }]}>
          ₹{metrics.netWorth.toLocaleString()}
        </Text>
        <Text style={[styles.rowLabel, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>ALL TIME BALANCE</Text>
      </View>

      {/* Sync Overlay Modal */}
      <Modal visible={showSyncModal} transparent animationType="fade">
        <View style={styles.syncOverlay}>
          <View style={[styles.syncCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.syncIconContainer}>
               <MaterialIcons name="cloud-sync" size={60} color={colors.primary} />
            </View>
            
            <Text style={[styles.syncTitle, { color: colors.text }]}>Initializing JayLedger</Text>
            <Text style={[styles.syncMessage, { color: colors.textSecondary }]}>
              {syncError ? 'Action Required' : 'Setting up your personal finance workspace...'}
            </Text>

            <View style={styles.syncProgressContainer}>
              {syncError ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={32} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{syncError}</Text>
                  <TouchableOpacity 
                    style={[styles.retryBtn, { backgroundColor: colors.primary }]} 
                    onPress={handleInitialSync}
                  >
                    <Text style={styles.retryBtnText}>Connect & Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.stepsContainer}>
                  {[
                    'Pushing local changes...',
                    'Syncing Transactions',
                    'Syncing Budgets',
                    'Syncing Goals',
                    'Calculating reports',
                    'Finalizing'
                  ].map((step) => {
                    const isDone = [
                      'Pushing local changes...',
                      'Syncing Transactions',
                      'Syncing Budgets',
                      'Syncing Goals',
                      'Calculating reports',
                      'Finalizing'
                    ].indexOf(step) < [
                      'Pushing local changes...',
                      'Syncing Transactions',
                      'Syncing Budgets',
                      'Syncing Goals',
                      'Calculating reports',
                      'Finalizing'
                    ].indexOf(syncStatus);
                    
                    const isActive = syncStatus === step;
                    
                    return (
                      <View key={step} style={styles.stepRow}>
                        <View style={[
                          styles.stepIndicator, 
                          { backgroundColor: isDone ? colors.success : isActive ? colors.primary : colors.border }
                        ]}>
                          {isDone ? (
                            <MaterialIcons name="check" size={12} color="#fff" />
                          ) : isActive ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : null}
                        </View>
                        <Text style={[
                          styles.stepText, 
                          { color: isDone ? colors.text : isActive ? colors.primary : colors.textSecondary }
                        ]}>
                          {step}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {!syncError && (
              <View style={styles.spinnerContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.syncSubMessage, { color: colors.textSecondary }]}>This may take a minute...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainCard: { 
    padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 12,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  cardSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  mainAmount: { fontSize: 36, fontWeight: '800', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rowValue: { fontSize: 20, fontWeight: '800' },
  payDayMain: { flex: 1 },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 100, gap: 5 }, // 7 dots * 8px + 6 gaps * 5px = 56 + 30 = 86px (fits in 100)
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 5 },
  circularContainer: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: { fontSize: 20, fontWeight: '800' },
  progressSub: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'right' },
  catRow: { marginBottom: 16 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmt: { fontSize: 14, fontWeight: '700' },
  catProgressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 3 },
  
  // Sync Overlay Styles
  syncOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  syncCard: {
    width: '100%',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  syncIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  syncTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  syncMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  syncProgressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncSubMessage: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
