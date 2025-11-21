import React from 'react';
import { ScrollView } from 'react-native';
import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import RemainingForPeriodCard from '../components/Overview/RemainingForPeriodCard';
import DailyLimitCard from '../components/Overview/DailyLimitCard';
import PayDayCard from '../components/Overview/PayDayCard';
import PeriodSummaryCard from '../components/Overview/PeriodSummaryCard';
import NetWorthCard from '../components/Overview/NetWorthCard';
import TopCategoriesCard from '../components/Overview/TopCategoriesCard';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useOverview } from '../hooks/useOverview';

const OverviewScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const { overview, loading } = useOverview(user.id);

  return (
    <>
      <AppBar title="JayLedger" showBack={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <PageHeader title="Overview" />

        <RemainingForPeriodCard
          loading={loading.remaining}
          progress={overview.progressRemaining}
          remaining={overview.remaining}
        />

        <DailyLimitCard
          loading={loading.dailyLimit}
          limit={overview.dailyLimit}
          spent={overview.spentToday}
          remaining={overview.dailyLimit - overview.spentToday}
          onPress={() =>
            navigation.navigate('TodaysView', {
              data: {
                limit: overview.dailyLimit,
                spent: overview.spentToday,
                remaining: overview.dailyLimit - overview.spentToday,
              },
              activeTab: 'Overview',
            })
          }
        />

        <PayDayCard
          onPress={() => navigation.navigate('CalendarView', { activeTab: 'Overview' })}
        />

        <TopCategoriesCard loading={loading.topCategories} data={overview.topCategories} />

        <PeriodSummaryCard
          period="month"
          loading={loading.month}
          income={overview.monthIncome}
          expense={overview.monthExpense}
          previncome={overview.prevMonthIncome}
          prevexpense={overview.prevMonthExpense}
          onPress={() =>
            navigation.navigate('MonthlySummary', {
              title: 'Summary For Month',
              activeTab: 'Overview',
            })
          }
        />

        <PeriodSummaryCard
          period="year"
          loading={loading.year}
          income={overview.yearIncome}
          expense={overview.yearExpense}
          previncome={overview.prevYearIncome}
          prevexpense={overview.prevYearExpense}
          onPress={() =>
            navigation.navigate('YearlySummary', {
              title: 'Summary For Year',
              activeTab: 'Overview',
            })
          }
        />

        <NetWorthCard loading={loading.netWorth} amount={overview.netWorth} />
      </ScrollView>
    </>
  );
};

export default OverviewScreen;
