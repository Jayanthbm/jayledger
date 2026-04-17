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
import { format, endOfMonth } from 'date-fns';
import { Transaction, Category } from '../models/types';
import {
  getCategories,
  toggleCategoryLivingCost,
  getMinTransactionDate,
} from '../db/queries';

import {
  fetchReportData,
  handleReportDrillDown,
  sortReportData
} from '../services/reportService';

// Modular Components
import { ReportSelectors } from '../components/reports/ReportSelectors';
import { ReportSummary } from '../components/reports/ReportSummary';
import { ReportListItem } from '../components/reports/ReportListItem';
import { ReportEmptyState } from '../components/reports/ReportEmptyState';
import { ReportSortPicker } from '../components/reports/ReportSortPicker';
import { ReportDrillDownModal } from '../components/reports/ReportDrillDownModal';
import { ReportConfigModal } from '../components/reports/ReportConfigModal';
import { SearchBar } from '../components/SearchBar';

const { width } = Dimensions.get('window');
const currentYear = new Date().getFullYear();

export default function ReportView({ route, navigation }: any) {
  const { reportType, title } = route.params;
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
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

  const insets = useSafeAreaInsets();
  const monthStr = (month + 1).toString().padStart(2, '0');
  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const displayTitle = useMemo(() => {
    if (!isSummary) return title;
    const dateStr = reportType === 'yearlySummary' ? year : `${[
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ][month]} ${year}`;
    return `${title} | ${dateStr}`;
  }, [reportType, title, month, year, isSummary]);

  const summaryMetrics = useMemo(() => {
    if (!isSummary) return null;
    const incomeObj = data.find(d => d.type?.toLowerCase() === 'income');
    const expenseObj = data.find(d => d.type?.toLowerCase() === 'expense');

    const income = Number(incomeObj?.totalAmount || 0);
    const expense = Number(expenseObj?.totalAmount || 0);
    const saved = income - expense;
    const spentPercent = income > 0 ? (expense / income) * 100 : 0;

    return { income, expense, saved, spentPercent };
  }, [data, isSummary]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const result = await fetchReportData(session.user.id, reportType, type, monthStr, year);
      setData(result);
    } catch (error) {
      console.error("Report Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, reportType, monthStr, year, type]);


  const handleDrillDown = async (item: any) => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const txs = await handleReportDrillDown(session.user.id, reportType, item, type, monthStr, year);
      setDrillDownData(txs);
      setDrillDownTitle(item.category_name || item.payee_name || item.name);
      setShowDrillDown(true);
    } catch (e) {
      console.error("Drilldown error:", e);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    return sortReportData(data, searchQuery, sortBy, sortAsc);
  }, [data, searchQuery, sortBy, sortAsc]);

  const totalAmount = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + (item.amount || item.totalAmount || 0), 0);
  }, [sortedData]);

  const showMonthSelector = reportType !== 'yearlySummary' && reportType !== 'payees' && reportType !== 'categories';
  const showYearSelector = reportType !== 'payees' && reportType !== 'categories';
  const showTypeToggle = ['summaryByPayee', 'summaryByCategory', 'payees', 'categories'].includes(reportType);

  useEffect(() => {
    const fetchMinDate = async () => {
      if (session?.user?.id) {
        try {
          const d = await getMinTransactionDate(session.user.id);
          if (d) setMinDate(new Date(d));
        } catch (error) {
          console.error("Error fetching min transaction date:", error);
        }
      }
    };
    fetchMinDate();
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAllCategories = async () => {
    if (!session?.user?.id) return;
    const cats = await getCategories(session.user.id);
    setAllCategories(cats.filter(c => c.type === 'Expense'));
  };

  const handleToggleLivingCost = async (catId: string, current: boolean) => {
    await toggleCategoryLivingCost(catId, !current);
    loadAllCategories();
    loadData();
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.7} onPress={scrollToTop} style={{ alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{displayTitle}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 12, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: reportType === 'monthlyLivingCosts' ? () => (
        <TouchableOpacity onPress={() => { loadAllCategories(); setShowConfig(true); }} style={{ paddingRight: 16 }} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <Icon name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : undefined
    });
  }, [navigation, reportType, colors.text, displayTitle, scrollToTop]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ReportSelectors
        type={type} setType={setType}
        year={year} month={month} setYear={setYear} setMonth={setMonth}
        reportType={reportType} minDate={minDate} maxDate={maxDate}
        showTypeToggle={showTypeToggle} showYearSelector={showYearSelector} showMonthSelector={showMonthSelector}
        colors={colors}
      />

      {(reportType === 'payees' || reportType === 'categories') && (
        <View style={styles.searchContainer}>
          <View style={styles.headerControls}>
            <SearchBar
              value={searchQuery} onChangeText={setSearchQuery}
              placeholder={`Search ${reportType === 'payees' ? 'payees' : 'categories'}...`}
              size="medium" containerStyle={{ flex: 1 }}
            />
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowSortPicker(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="sort" size={18} color={colors.primary} />
                <Icon name={sortAsc ? "arrow-upward" : "arrow-downward"} size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.captionRow}>
            <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>
              Sorted by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </View>
        </View>
      )}

      <ReportSummary
        isSummary={isSummary} summaryMetrics={summaryMetrics}
        totalAmount={totalAmount} type={type} data={data}
        searchQuery={searchQuery} sortedDataLength={sortedData.length}
        colors={colors}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView ref={scrollRef} style={styles.content} showsVerticalScrollIndicator={false}>
          {sortedData.length === 0 ? (
            <ReportEmptyState
              searchQuery={searchQuery} reportType={reportType} colors={colors}
              onClearFilters={() => setSearchQuery('')}
              onOpenConfig={() => { loadAllCategories(); setShowConfig(true); }}
            />
          ) : (
            !isSummary && sortedData.map((item, idx) => (
              <ReportListItem
                key={idx} item={item} type={type} totalAmount={totalAmount}
                isDark={isDark} colors={colors} onPress={() => handleDrillDown(item)}
              />
            ))
          )}
        </ScrollView>
      )}

      <ReportSortPicker
        visible={showSortPicker} onClose={() => setShowSortPicker(false)}
        sortBy={sortBy} sortAsc={sortAsc} onSortChange={(b, a) => { setSortBy(b); setSortAsc(a); }}
        colors={colors}
      />

      <ReportDrillDownModal
        visible={showDrillDown} onClose={() => setShowDrillDown(false)}
        title={drillDownTitle} data={drillDownData} colors={colors} bottomInset={insets.bottom}
      />

      <ReportConfigModal
        visible={showConfig} onClose={() => setShowConfig(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        allCategories={allCategories} onToggleLivingCost={handleToggleLivingCost}
        colors={colors} bottomInset={insets.bottom} width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sortButton: {
    width: 64, height: 44, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  captionRow: { marginTop: 2, alignItems: 'flex-end' },
  sortCaption: {
    fontSize: 9, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
