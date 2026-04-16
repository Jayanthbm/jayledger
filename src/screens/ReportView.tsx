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
  TextInput,
  Platform
} from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import Icon from '@expo/vector-icons/MaterialIcons';
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
  getMinTransactionYear
} from '../db/queries';
import { format, endOfMonth } from 'date-fns';
import { Transaction, Category } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';

const { width } = Dimensions.get('window');

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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
  const [years, setYears] = useState<string[]>([currentYear.toString()]);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const insets = useSafeAreaInsets();
  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'amount'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortPicker, setShowSortPicker] = useState(false);

  const showMonthSelector = reportType !== 'yearlySummary' && reportType !== 'payees' && reportType !== 'categories';
  const showYearSelector = reportType !== 'payees' && reportType !== 'categories';
  const showTypeToggle = ['summaryByPayee', 'summaryByCategory', 'payees', 'categories'].includes(reportType);

  const monthStr = (month + 1).toString().padStart(2, '0');

  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);

  const displayTitle = useMemo(() => {
    if (!isSummary) return title;
    const dateStr = reportType === 'yearlySummary' ? year : `${months[month]} ${year}`;
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

    // Dynamic Years
    const minYear = await getMinTransactionYear(userId);
    const generatedYears = [];
    for (let y = currentYear; y >= minYear; y--) {
      generatedYears.push(y.toString());
    }
    setYears(generatedYears);

    } catch (error) {
      console.error("Report Load Error:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, reportType, monthStr, year, type]);

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
        txs = all.filter(t => t.category_name === (item.category_name || item.name) && t.type === (item.type || type));
      } else if (reportType === 'summaryByPayee' || reportType === 'payees') {
        const fetchStartDate = isOverview ? '1970-01-01' : startDate;
        const fetchEndDate = isOverview ? '2099-12-31' : endDate;
        const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
        txs = all.filter(t => (t.payee_name === (item.payee_name || item.name)) && t.type === (item.type || type));
      } else if (reportType === 'subscriptionAndBills') {
        const all = await getTransactionsByDateRange(userId, startDate, endDate);
        txs = all.filter(t => t.category_name === item.category_name);
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
      let valA = sortKey === 'name' ? (a.name || a.category_name || '') : (a.amount || a.totalAmount || 0);
      let valB = sortKey === 'name' ? (b.name || b.category_name || '') : (b.amount || b.totalAmount || 0);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });
  }, [data, searchQuery, sortKey, sortOrder]);

  const totalAmount = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + (item.amount || item.totalAmount || 0), 0);
  }, [sortedData]);

  const renderMonthPicker = () => (
    <BottomSheet
      visible={showMonthPicker}
      onClose={() => setShowMonthPicker(false)}
      title="Select Month"
    >
      <View style={{ marginTop: 10 }}>
        {months.map((m, i) => {
          const isActive = i === month;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                setMonth(i);
                setShowMonthPicker(false);
              }}
            >
              <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>{m}</Text>
              {isActive && <Icon name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );

  const renderYearPicker = () => (
    <BottomSheet
      visible={showYearPicker}
      onClose={() => setShowYearPicker(false)}
      title="Select Year"
    >
      <View style={{ marginTop: 10 }}>
        {years.map((y) => {
          const isActive = y === year;
          return (
            <TouchableOpacity
              key={y}
              style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                setYear(y);
                setShowYearPicker(false);
              }}
            >
              <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>{y}</Text>
              {isActive && <Icon name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );

  const renderSortPicker = () => {
    const sortOptions = [
      { label: 'Amount (High to Low)', key: 'amount', order: 'desc' },
      { label: 'Amount (Low to High)', key: 'amount', order: 'asc' },
      { label: 'Name (A-Z)', key: 'name', order: 'asc' },
      { label: 'Name (Z-A)', key: 'name', order: 'desc' },
    ];

    return (
      <BottomSheet
        visible={showSortPicker}
        onClose={() => setShowSortPicker(false)}
        title="Sort By"
      >
        <View style={{ marginTop: 10 }}>
          {sortOptions.map((opt) => {
            const isActive = sortKey === opt.key && sortOrder === opt.order;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSortKey(opt.key as any);
                  setSortOrder(opt.order as any);
                  setShowSortPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>{opt.label}</Text>
                {isActive && <Icon name="check" size={20} color={colors.primary} />}
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

      <View style={styles.selectors}>
        {showTypeToggle && (
          <SegmentedControl
            options={[
              { label: 'Expense', value: 'Expense', activeColor: colors.danger },
              { label: 'Income', value: 'Income', activeColor: colors.success }
            ]}
            selectedValue={type}
            onValueChange={(val) => setType(val)}
            variant="medium"
            containerStyle={{ marginBottom: 12 }}
          />
        )}

        <View style={styles.dateSelectors}>
          {showYearSelector && (
            <TouchableOpacity
              style={[styles.selectorBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={{ color: colors.text }}>{year}</Text>
              <Icon name="arrow-drop-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {showMonthSelector && (
            <TouchableOpacity
              style={[styles.selectorBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowMonthPicker(true)}
            >
              <Text style={{ color: colors.text }}>{months[month]}</Text>
              <Icon name="arrow-drop-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(reportType === 'payees' || reportType === 'categories') && (
        <View style={[styles.searchContainer, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[styles.searchBar, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search ${reportType === 'payees' ? 'payees' : 'categories'}...`}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowSortPicker(true)}
          >
            <Icon name="sort" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {isSummary && summaryMetrics ? (
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.success + '15' }]}>
              <Icon name="trending-up" size={24} color={colors.success} />
            </View>
            <View style={styles.summaryTextColumn}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>INCOME</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>₹{summaryMetrics.income.toLocaleString()}</Text>
            </View>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.danger + '15' }]}>
              <Icon name="trending-down" size={24} color={colors.danger} />
            </View>
            <View style={styles.summaryTextColumn}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>₹{summaryMetrics.expense.toLocaleString()}</Text>
            </View>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Icon name="account-balance-wallet" size={24} color={colors.primary} />
            </View>
            <View style={styles.summaryTextColumn}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>SAVED</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ₹{String(summaryMetrics.saved?.toLocaleString() || '0')}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: colors.textSecondary + '15' }]}>
              <Icon name="pie-chart" size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.summaryTextColumn}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>SPENT</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {String(summaryMetrics.spentPercent?.toFixed(1) || '0.0')}%
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.summaryBanner}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL</Text>
          <Text style={[styles.summaryAmount, { color: (data[0]?.type || type) === 'Income' ? colors.success : colors.danger }]}>
            ₹{totalAmount.toLocaleString()}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
          <ScrollView
          ref={scrollRef}
            style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {sortedData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery.trim() ? 'No matching results found' : 'No data found for this period'}
              </Text>
                {reportType === 'monthlyLivingCosts' && !searchQuery.trim() && (
                  <TouchableOpacity
                    style={[styles.configPrompt, { backgroundColor: colors.primary }]}
                    onPress={() => { loadAllCategories(); setShowConfig(true); }}
                  >
                    <Text style={styles.configPromptText}>Select Living Cost Categories</Text>
                  </TouchableOpacity>
                )}
            </View>
          ) : (
            !isSummary && sortedData.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.reportItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleDrillDown(item)}
              >
                <View style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    {item.category_app_icon && (
                      <Icon name={item.category_app_icon as any} size={24} color={colors.primary} style={{ marginRight: 12 }} />
                    )}
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.category_name || item.payee_name || item.name || item.type}
                    </Text>
                  </View>
                  <Text style={[styles.itemAmount, { color: (item.type || type) === 'Income' ? colors.success : colors.danger }]}>
                    ₹{(item.amount || item.totalAmount || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBg, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, ((item.amount || item.totalAmount || 1) / (totalAmount || 1)) * 100)}%`,
                          backgroundColor: (item.type || type) === 'Income' ? colors.success : colors.danger
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
                    {(((item.amount || item.totalAmount || 0) / (totalAmount || 1)) * 100).toFixed(0)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {renderMonthPicker()}
      {renderYearPicker()}
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
              <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Icon name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search categories..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="cancel" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={allCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
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
  selectors: { paddingHorizontal: 16, marginBottom: 16, paddingTop: 12 },
  dateSelectors: { flexDirection: 'row', gap: 12 },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  summaryBanner: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center'
  },
  summaryLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, opacity: 0.7 },
  summaryAmount: { fontSize: 36, fontWeight: '800' },
  summaryGrid: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  summaryBox: {
    width: '100%',
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextColumn: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  reportItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPercent: { fontSize: 12, fontWeight: '600', width: 35 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  configPrompt: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  configPromptText: {
    color: 'white',
    fontWeight: '700',
  },
  pickerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 16, fontWeight: '500' },
  fullModal: { flex: 1 },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth:1
  },
  configName: { fontSize: 16, marginLeft: 12, fontWeight: '500' },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
    padding: 0,
  },
  sortTrigger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
