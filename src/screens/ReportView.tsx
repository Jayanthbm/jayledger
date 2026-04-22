import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { endOfMonth } from 'date-fns';
import { Transaction, Category, ReportItem } from '../models/types';
import { getCategories, toggleCategoryLivingCost, getMinTransactionDate } from '../db/queries';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { fetchReportData, handleReportDrillDown, sortReportData } from '../services/reportService';

// Modular Components
import { ReportSelectors } from '../components/reports/ReportSelectors';
import { ReportSummary } from '../components/reports/ReportSummary';
import { ReportListItem } from '../components/reports/ReportListItem';
import { ReportEmptyState } from '../components/reports/ReportEmptyState';
import { ReportSortPicker } from '../components/reports/ReportSortPicker';
import { ReportDrillDownModal } from '../components/reports/ReportDrillDownModal';
import { ReportConfigModal } from '../components/reports/ReportConfigModal';
import { SearchBar } from '../components/SearchBar';
import { common } from '../styles/common';
import { RootStackParamList } from '../navigation/navigationTypes';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');
const currentYear = new Date().getFullYear();

type ReportViewProps = NativeStackScreenProps<RootStackParamList, 'ReportDetail'>;

export default function ReportView({ route, navigation }: ReportViewProps) {
  const reportType = String(route.params?.reportType ?? '');
  const title = route.params?.title ?? 'Report';
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportItem[]>([]);
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(currentYear.toString());
  const [minDate, setMinDate] = useState<Date>(new Date(currentYear, 0, 1));
  const maxDate = useMemo(() => endOfMonth(new Date()), []);

  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount'>('amount');
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [useFullPreviousPeriod, setUseFullPreviousPeriod] = useState(true);

  const insets = useSafeAreaInsets();
  const monthStr = (month + 1).toString().padStart(2, '0');
  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);

  const now = useMemo(() => new Date(), []);
  const isCurrentPeriod = useMemo(() => {
    const isCurrentYear = parseInt(year) === now.getFullYear();
    const isCurrentMonth = isCurrentYear && month === now.getMonth();

    if (
      reportType === 'yearlySummary' ||
      reportType === 'transactionsByYear' ||
      reportType === 'yearlyPayees'
    ) {
      return isCurrentYear;
    }
    // All other reports are monthly
    return isCurrentMonth;
  }, [reportType, year, month, now]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const displayTitle = useMemo(() => {
    const isYearly =
      reportType === 'yearlySummary' ||
      reportType === 'transactionsByYear' ||
      reportType === 'yearlyPayees';
    if (!isSummary && !isYearly) return title;

    const dateStr = isYearly
      ? year
      : `${
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
            month
          ]
        } ${year}`;
    return `${title} | ${dateStr}`;
  }, [reportType, title, month, year, isSummary]);

  const summaryMetrics = useMemo(() => {
    if (!isSummary) return null;
    const incomeObj = data.find((d) => d.type?.toLowerCase() === 'income');
    const expenseObj = data.find((d) => d.type?.toLowerCase() === 'expense');

    const income = Number(incomeObj?.totalAmount || 0);
    const expense = Number(expenseObj?.totalAmount || 0);
    const saved = income - expense;
    const spentPercent = income > 0 ? (expense / income) * 100 : 0;

    // Comparison data
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

  const totalDiff = useMemo(() => {
    if (isSummary || data.length === 0 || reportType === 'payees' || reportType === 'categories')
      return 0;

    const hasPrev = data.some((item) => item.prevAmount !== undefined);
    if (!hasPrev) return 0;

    const prevTotal = data.reduce((sum, item) => sum + (item.prevAmount || 0), 0);
    if (prevTotal > 0) {
      return ((totalAmount - prevTotal) / prevTotal) * 100;
    }
    return totalAmount > 0 ? 100 : 0;
  }, [data, totalAmount, isSummary, reportType]);

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

  const showMonthSelector =
    reportType !== 'yearlySummary' &&
    reportType !== 'payees' &&
    reportType !== 'categories' &&
    reportType !== 'transactionsByYear' &&
    reportType !== 'yearlyPayees';
  const showYearSelector = reportType !== 'payees' && reportType !== 'categories';
  const showTypeToggle = [
    'summaryByPayee',
    'summaryByCategory',
    'payees',
    'categories',
    'transactionsByYear',
    'yearlyPayees',
  ].includes(reportType);

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
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const loadAllCategories = async () => {
    if (!session?.user?.id) return;
    const cats = await getCategories(session.user.id);
    setAllCategories(cats.filter((c) => c.type === 'Expense'));
  };

  const handleToggleLivingCost = async (catId: string, current: boolean) => {
    await toggleCategoryLivingCost(catId, !current);
    loadAllCategories();
    loadData();
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>{displayTitle}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeftContainer}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight:
        reportType === 'monthlyLivingCosts'
          ? () => (
              <TouchableOpacity
                onPress={() => setShowConfig(true)}
                style={styles.headerRightContainer}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Icon name="settings" size={24} color={colors.text} />
              </TouchableOpacity>
            )
          : undefined,
    });
  }, [navigation, reportType, colors, displayTitle, scrollToTop]);

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <ReportSelectors
        type={type}
        setType={setType}
        year={year}
        month={month}
        setYear={setYear}
        setMonth={setMonth}
        reportType={reportType}
        minDate={minDate}
        maxDate={maxDate}
        showTypeToggle={showTypeToggle}
        showYearSelector={showYearSelector}
        showMonthSelector={showMonthSelector}
        colors={colors}
      />

      {isCurrentPeriod && reportType !== 'payees' && reportType !== 'categories' && (
        <View style={styles.comparisonIconRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.comparisonIconBtn,
              {
                backgroundColor: useFullPreviousPeriod ? colors.primary + '15' : colors.card,
                borderColor: useFullPreviousPeriod ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setUseFullPreviousPeriod(!useFullPreviousPeriod)}
          >
            <Icon
              name={useFullPreviousPeriod ? 'history-toggle-off' : 'history'}
              size={18}
              color={useFullPreviousPeriod ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.comparisonIconText,
                { color: useFullPreviousPeriod ? colors.primary : colors.textSecondary },
              ]}
            >
              Full{' '}
              {reportType === 'yearlySummary' ||
              reportType === 'transactionsByYear' ||
              reportType === 'yearlyPayees'
                ? 'Year'
                : 'Month'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(reportType === 'payees' || reportType === 'categories') && (
        <View style={styles.searchContainer}>
          <View style={common.headerControls}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${reportType === 'payees' ? 'payees' : 'categories'}...`}
              size="medium"
              containerStyle={common.flex1}
            />
            <TouchableOpacity
              style={[
                common.sortButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setShowSortPicker(true)}
            >
              <View style={common.flexRowCenterGap4}>
                <Icon name="sort" size={18} color={colors.primary} />
                <Icon
                  name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                  size={14}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>
          <View style={common.captionRowT2}>
            <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>
              Sorted by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </View>
        </View>
      )}

      <ReportSummary
        isSummary={isSummary}
        summaryMetrics={summaryMetrics}
        totalAmount={totalAmount}
        totalDiff={totalDiff}
        type={type}
        data={data}
        searchQuery={searchQuery}
        sortedDataLength={sortedData.length}
        colors={colors}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false}>
          {sortedData.length === 0 ? (
            <ReportEmptyState
              searchQuery={searchQuery}
              reportType={reportType}
              colors={colors}
              onClearFilters={() => setSearchQuery('')}
              onOpenConfig={() => {
                loadAllCategories();
                setShowConfig(true);
              }}
            />
          ) : (
            !isSummary &&
            sortedData.map((item, idx) => (
              <ReportListItem
                key={idx}
                item={item}
                type={type}
                totalAmount={totalAmount}
                isDark={isDark}
                colors={colors}
                onPress={() => handleDrillDown(item)}
              />
            ))
          )}
        </ScrollView>
      )}

      <ReportSortPicker
        visible={showSortPicker}
        onClose={() => setShowSortPicker(false)}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(b, a) => {
          setSortBy(b);
          setSortAsc(a);
        }}
      />

      <ReportDrillDownModal
        visible={showDrillDown}
        onClose={() => setShowDrillDown(false)}
        title={drillDownTitle}
        data={drillDownData}
        colors={colors}
        bottomInset={insets.bottom}
      />

      <ReportConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        allCategories={allCategories}
        onToggleLivingCost={handleToggleLivingCost}
        colors={colors}
        bottomInset={insets.bottom}
        width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  sortCaption: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerLeftContainer: { paddingRight: 12, justifyContent: 'center', alignItems: 'center' },
  headerRightContainer: { paddingRight: 16 },
  loader: { marginTop: 40 },
  comparisonIconRow: {
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 8,
    alignItems: 'center',
  },
  comparisonIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  comparisonIconText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
