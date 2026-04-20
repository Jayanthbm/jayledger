import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { format } from 'date-fns';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardSync } from '../hooks/useDashboardSync';
import { DashboardRemainingCard } from '../components/dashboard/DashboardRemainingCard';
import { DashboardDailyLimit } from '../components/dashboard/DashboardDailyLimit';
import { DashboardPayDay } from '../components/dashboard/DashboardPayDay';
import { DashboardSummaryCard } from '../components/dashboard/DashboardSummaryCard';
import { DashboardTopCategories } from '../components/dashboard/DashboardTopCategories';
import { DashboardNetWorth } from '../components/dashboard/DashboardNetWorth';
import { DashboardSyncModal } from '../components/dashboard/DashboardSyncModal';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<AppNavigation>();
  const scrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const { metrics, loading, loadData, dailyLimitCalc, payDayInfo } = useDashboardData(
    session?.user?.id,
  );
  const {
    showSyncModal,
    syncStatus,
    isSyncing,
    syncError,
    lastSyncTime,
    handleInitialSync,
    handleManualSync,
  } = useDashboardSync(session?.user?.id, loadData);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Dashboard</Text>
          {lastSyncTime ? (
            <Text style={[common.navHeaderSubtitle, { color: colors.textSecondary }]}>
              Synced: {lastSyncTime}
            </Text>
          ) : null}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleManualSync}
          style={common.headerRightBtn}
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

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[common.screenPadding16, { backgroundColor: colors.background }]}
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
