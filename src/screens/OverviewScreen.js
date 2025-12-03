import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';

import AppBar from '../components/app/AppBar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Components
import BalanceCard from '../components/Overview/BalanceCard';
import DailyStatsCard from '../components/Overview/DailyStatsCard';
import PeriodSummaryCard from '../components/Overview/PeriodSummaryCard';
import RecentTransactionsList from '../components/Overview/RecentTransactionsList';

// Hooks
import { useOverview } from '../hooks/useOverview';
import { useCategories } from '../hooks/useCategories';
import { usePayees } from '../hooks/usePayees';

const OverviewScreen = () => {
  const { toggleTheme, theme } = useTheme();
  const { user } = useAuth();

  // Use custom hooks
  const { overview, loading: overviewLoading, refresh: refreshOverview } = useOverview(user?.id);
  const { categories } = useCategories(user?.id);
  const { payees } = usePayees(user?.id);

  // Create lookup maps for O(1) access
  const categoryMap = useMemo(() => {
    return (categories || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  }, [categories]);

  const payeeMap = useMemo(() => {
    return (payees || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  }, [payees]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar
        title="Overview"
        showBack={false}
        icons={[
          {
            name: 'theme-light-dark',
            onPress: toggleTheme,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={overviewLoading.remaining} onRefresh={refreshOverview} />
        }
      >
        {/* 1. Remaining Balance & Days Left */}
        <BalanceCard
          balance={overview.remaining}
          daysLeft={overview.daysRemaining}
        />

        {/* 2. Spent Today & Daily Limit */}
        <DailyStatsCard
          spent={overview.spentToday}
          limit={overview.dailyLimit}
        />

        {/* 3. Current Month Income & Expense */}
        <PeriodSummaryCard
          period="month"
          income={overview.monthIncome}
          expense={overview.monthExpense}
          previncome={overview.prevMonthIncome}
          prevexpense={overview.prevMonthExpense}
        />

        {/* 4. Current Year Income & Expense */}
        <PeriodSummaryCard
          period="year"
          income={overview.yearIncome}
          expense={overview.yearExpense}
          previncome={overview.prevYearIncome}
          prevexpense={overview.prevYearExpense}
        />

        {/* 5. Recent Transactions */}
        <RecentTransactionsList
          transactions={overview.recentTransactions}
          categoryMap={categoryMap}
          payeeMap={payeeMap}
        />

        {/* Spacer for Bottom Tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
});

export default OverviewScreen;
