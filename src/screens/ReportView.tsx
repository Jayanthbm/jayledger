import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { SearchBar } from '../components/SearchBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { ReportSelectors } from '../components/ReportSelectors';
import { ReportSummary } from '../components/ReportSummary';
import { ReportListItem } from '../components/ReportListItem';
import { ReportEmptyState } from '../components/ReportEmptyState';
import {
  getReportMonthlyLivingCosts,
  getReportSubscriptionBills,
  getReportSummaryByPayee,
  getReportSummaryByCategory,
  getReportMonthlySummary,
  getReportYearlySummary,
  getReportPayeesOverview,
  getReportCategoriesOverview,
  getCategories,
  toggleCategoryLivingCost,
  getTransactionsByDateRange,
  getMinTransactionDate,
} from '../db/queries';
import { format, endOfMonth } from 'date-fns';
import { Transaction, Category } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';

const { width } = Dimensions.get('window');

const currentYear = new Date().getFullYear();

export default function ReportView({ route, navigation }: any) {
  const { reportType, title } = route.params;
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

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

  const insets = useSafeAreaInsets();
  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount'>('amount');
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);

  const showMonthSelector = reportType !== 'yearlySummary' && reportType !== 'payees' && reportType !== 'categories';
  const showYearSelector = reportType !== 'payees' && reportType !== 'categories';
  const showTypeToggle = ['summaryByPayee', 'summaryByCategory', 'payees', 'categories'].includes(reportType);

  const monthStr = (month + 1).toString().padStart(2, '0');

  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);

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
      let result: any[] = [];
      const userId = session.user.id;

      switch (reportType) {
        case 'monthlyLivingCosts':
          result = await getReportMonthlyLivingCosts(userId, monthStr, year);
          break;
        case 'subscriptionAndBills':
          result = await getReportSubscriptionBills(userId, monthStr, year);
          break;
        case 'summaryByPayee':
          result = await getReportSummaryByPayee(userId, type, monthStr, year);
          break;
        case 'summaryByCategory':
          result = await getReportSummaryByCategory(userId, type, monthStr, year);
          break;
        case 'monthlySummary':
          result = await getReportMonthlySummary(userId, monthStr, year);
          break;
        case 'yearlySummary':
          result = await getReportYearlySummary(userId, year);
          break;
        case 'payees':
          result = await getReportPayeesOverview(userId, type);
          break;
        case 'categories':
          result = await getReportCategoriesOverview(userId, type);
          break;
      }
    setData(result);

    } catch (error) {
      console.error("Report Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, reportType, monthStr, year, type]);

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

  const handleDrillDown = async (item: any) => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      let txs: Transaction[] = [];
      const userId = session.user.id;
      const startDate = `${year}-${monthStr}-01`;
      const endDate = format(endOfMonth(new Date(parseInt(year), month)), 'yyyy-MM-dd');

      const isOverview = reportType === 'payees' || reportType === 'categories';

      if (reportType === 'summaryByCategory' || reportType === 'monthlyLivingCosts' || reportType === 'incomeVsExpense' || reportType === 'categories') {
        const fetchStartDate = isOverview ? '1970-01-01' : startDate;
        const fetchEndDate = isOverview ? '2099-12-31' : endDate;
        const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
        txs = all.filter((t: any) => t.category_name === (item.category_name || item.name) && t.type === (item.type || type));
      } else if (reportType === 'summaryByPayee' || reportType === 'payees') {
        const fetchStartDate = isOverview ? '1970-01-01' : startDate;
        const fetchEndDate = isOverview ? '2099-12-31' : endDate;
        const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
        txs = all.filter((t: any) => (t.payee_name === (item.payee_name || item.name)) && t.type === (item.type || type));
      } else if (reportType === 'subscriptionAndBills') {
        const all = await getTransactionsByDateRange(userId, startDate, endDate);
        txs = all.filter((t: any) => t.category_name === item.category_name);
      }

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
    let filtered = data;
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        (item.name || item.category_name || item.payee_name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      let valA = sortBy === 'name' ? (a.name || a.category_name || a.payee_name || '') : (a.amount || a.totalAmount || 0);
      let valB = sortBy === 'name' ? (b.name || b.category_name || b.payee_name || '') : (b.amount || b.totalAmount || 0);

      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        cmp = valA.localeCompare(valB);
      } else {
        cmp = Number(valA) - Number(valB);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [data, searchQuery, sortBy, sortAsc]);

  const totalAmount = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + (item.amount || item.totalAmount || 0), 0);
  }, [sortedData]);


  const renderSortPicker = () => {
    const sortOptions = [
      { label: 'Name', value: 'name' },
      { label: 'Amount', value: 'amount' },
    ];

    return (
      <BottomSheet
        visible={showSortPicker}
        onClose={() => setShowSortPicker(false)}
        title="Sort Results"
      >
        <View style={{ marginTop: 10 }}>
          {sortOptions.map((opt) => {
            const isActive = sortBy === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  if (isActive) {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortBy(opt.value as any);
                    setSortAsc(opt.value === 'name'); // Default Asc for name, Desc for amount
                  }
                  setShowSortPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>{opt.label}</Text>
                {isActive && (
                  <Icon 
                    name={sortAsc ? "arrow-upward" : "arrow-downward"} 
                    size={20} 
                    color={colors.primary} 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    );
  };

  const renderDrillDownBottomSheet = () => (
    <BottomSheet
      visible={showDrillDown}
      onClose={() => setShowDrillDown(false)}
      title={drillDownTitle}
      isFullScreen
    >
      <View style={{ flex: 1 }}>
        <FlatList
          data={drillDownData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="receipt-long" size={48} color={colors.border} />
              <Text style={{ textAlign: 'center', marginTop: 12, color: colors.textSecondary }}>No transactions found</Text>
            </View>
          }
        />
      </View>
    </BottomSheet>
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={{ alignItems: 'flex-start' }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{displayTitle}</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingRight: 12, justifyContent: 'center', alignItems: 'center' }}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      headerRight: reportType === 'monthlyLivingCosts' ? () => (
        <TouchableOpacity
          onPress={() => { loadAllCategories(); setShowConfig(true); }}
          style={{ paddingRight: 16, justifyContent: 'center', alignItems: 'center' }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Icon name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : undefined
    });
  }, [navigation, reportType, colors.text, displayTitle]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

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

      {(reportType === 'payees' || reportType === 'categories') && (
        <View style={styles.searchContainer}>
          <View style={styles.headerControls}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${reportType === 'payees' ? 'payees' : 'categories'}...`}
              size="medium"
              containerStyle={{ flex: 1 }}
            />
            <TouchableOpacity
              style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowSortPicker(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="sort" size={18} color={colors.primary} />
                <Icon 
                  name={sortAsc ? "arrow-upward" : "arrow-downward"} 
                  size={14} 
                  color={colors.primary} 
                />
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
        isSummary={isSummary}
        summaryMetrics={summaryMetrics}
        totalAmount={totalAmount}
        type={type}
        data={data}
        searchQuery={searchQuery}
        sortedDataLength={sortedData.length}
        colors={colors}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
          <ScrollView
          ref={scrollRef}
            style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {sortedData.length === 0 ? (
            <ReportEmptyState
              searchQuery={searchQuery}
              reportType={reportType}
              colors={colors}
              onClearFilters={() => setSearchQuery('')}
              onOpenConfig={() => { loadAllCategories(); setShowConfig(true); }}
            />
          ) : (
            !isSummary && sortedData.map((item, idx) => (
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

      {renderSortPicker()}
      {renderDrillDownBottomSheet()}

      {/* Living Cost Config Modal */}
      <BottomSheet
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        title="Configure Living Costs"
        isFullScreen
      >
        <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              size="medium"
            />
            </View>

            <FlatList
              data={allCategories.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={item => item.id}
              numColumns={3}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.configGridItem,
                    {
                      backgroundColor: colors.card,
                      borderColor: item.is_living_cost === 1 ? colors.primary : colors.border,
                      borderWidth: item.is_living_cost === 1 ? 2 : 1
                    }
                  ]}
                  onPress={() => handleToggleLivingCost(item.id, !!item.is_living_cost)}
                >
                  <View style={[styles.gridIconBox, { backgroundColor: (item.is_living_cost === 1 ? colors.primary : colors.textSecondary) + '20' }]}>
                    <Icon name={(item.app_icon || 'receipt') as any} size={24} color={item.is_living_cost === 1 ? colors.primary : colors.textSecondary} />
                  </View>
                  <Text style={[styles.gridConfigName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  {item.is_living_cost === 1 && (
                    <View style={styles.checkBadge}>
                      <Icon name="check" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 40 }}
              columnWrapperStyle={{ justifyContent: 'flex-start', gap: 8 }}
            />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  pickerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 16, fontWeight: '500' },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionRow: {
    marginTop: 2,
    alignItems: 'flex-end',
  },
  sortCaption: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configGridItem: {
    width: (width - 40) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridConfigName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  }
});
