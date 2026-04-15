import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
  Platform
} from 'react-native';
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
  getTransactionsByDateRange
} from '../db/queries';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Transaction, Category } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';

const { width } = Dimensions.get('window');

interface ReportViewProps {
  route: {
    params: {
      reportType: string;
      title: string;
    }
  };
  navigation: any;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

export default function ReportView({ route, navigation }: any) {
  const { reportType, title } = route.params;
  const { colors, isDark } = useTheme();
  const { session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(currentYear.toString());

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

    // For Categories and Payees overview/summary, navigate to Transactions screen
    if (['summaryByCategory', 'monthlyLivingCosts', 'payees', 'categories', 'summaryByPayee', 'subscriptionAndBills'].includes(reportType)) {
      const params: any = {};
      
      if (item.category_id || (item.category_name && reportType.includes('Category')) || reportType === 'monthlyLivingCosts' || reportType === 'subscriptionAndBills') {
        params.initialSelectedCats = item.category_id ? [item.category_id] : 
                                    (allCategories.find(c => c.name === item.category_name)?.id ? [allCategories.find(c => c.name === item.category_name)!.id] : []);
      } else if (item.payee_id || item.name || item.payee_name) {
        params.initialSelectedPayees = item.payee_id ? [item.payee_id] : [];
        // If we don't have ID, we might need to fetch it or match by name, 
        // but the query results should ideally have IDs.
      }

      // Add date range if applicable (not for overall Payees/Categories)
      if (reportType !== 'payees' && reportType !== 'categories') {
        params.initialStartDate = `${year}-${monthStr}-01`;
        params.initialEndDate = format(endOfMonth(new Date(parseInt(year), month)), 'yyyy-MM-dd');
      }

      // If we have categories or payees selected, navigate
      if (params.initialSelectedCats?.length > 0 || params.initialSelectedPayees?.length > 0) {
        navigation.navigate('Main', {
          screen: 'Transactions',
          params: params
        });
        return;
      }
    }

    // Fallback to existing modal drilldown if navigation is not suitable or ID is missing
    setLoading(true);
    try {
      let txs: Transaction[] = [];
      const userId = session.user.id;
      const startDate = `${year}-${monthStr}-01`;
      const endDate = format(endOfMonth(new Date(parseInt(year), month)), 'yyyy-MM-dd');

      if (reportType === 'summaryByCategory' || reportType === 'monthlyLivingCosts' || reportType === 'incomeVsExpense') {
        const all = await getTransactionsByDateRange(userId, startDate, endDate);
        txs = all.filter(t => t.category_name === item.category_name && t.type === (item.type || type));
      } else if (reportType === 'summaryByPayee' || reportType === 'payees') {
        const all = reportType === 'payees' ?
          await getTransactionsByDateRange(userId, '1970-01-01', '2099-12-31') :
          await getTransactionsByDateRange(userId, startDate, endDate);
        txs = all.filter(t => (t.payee_name === (item.payee_name || item.name)) && t.type === type);
      } else if (reportType === 'categories') {
        const all = await getTransactionsByDateRange(userId, '1970-01-01', '2099-12-31');
        txs = all.filter(t => (t.category_name === (item.category_name || item.name)) && t.type === type);
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
    <Modal visible={showMonthPicker} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowMonthPicker(false)}
      >
        <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Month</Text>
          <ScrollView>
            {months.map((m, i) => (
              <TouchableOpacity
                key={m}
                style={styles.pickerItem}
                onPress={() => {
                  setMonth(i);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: i === month ? colors.primary : colors.text }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  useEffect(() => {
    navigation.setOptions({
      title: displayTitle,
      headerRight: reportType === 'monthlyLivingCosts' ? () => (
        <TouchableOpacity 
          onPress={() => { loadAllCategories(); setShowConfig(true); }} 
          style={{ paddingRight: 16, justifyContent: 'center', alignItems: 'center' }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Icon name="settings" size={24} color={colors.primary} />
        </TouchableOpacity>
      ) : undefined
    });
  }, [navigation, reportType, colors.primary, displayTitle]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.selectors}>
        {showTypeToggle && (
          <View style={[styles.typeToggle, { backgroundColor: isDark ? '#1f1f1f' : '#f0f0f0' }]}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Expense' && { backgroundColor: colors.card }]}
              onPress={() => setType('Expense')}
            >
              <Text style={[styles.typeBtnText, { color: type === 'Expense' ? colors.danger : colors.textSecondary }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Income' && { backgroundColor: colors.card }]}
              onPress={() => setType('Income')}
            >
              <Text style={[styles.typeBtnText, { color: type === 'Income' ? colors.success : colors.textSecondary }]}>Income</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <View style={styles.sortControls}>
            <TouchableOpacity 
              style={[styles.sortBtn, sortKey === 'name' && { borderColor: colors.primary }]}
              onPress={() => {
                if (sortKey === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortKey('name'); setSortOrder('asc'); }
              }}
            >
              <Text style={[styles.sortBtnText, { color: sortKey === 'name' ? colors.primary : colors.textSecondary }]}>Name</Text>
              {sortKey === 'name' && <Icon name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={14} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortBtn, sortKey === 'amount' && { borderColor: colors.primary }]}
              onPress={() => {
                if (sortKey === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortKey('amount'); setSortOrder('desc'); }
              }}
            >
              <Text style={[styles.sortBtnText, { color: sortKey === 'amount' ? colors.primary : colors.textSecondary }]}>Amount</Text>
              {sortKey === 'amount' && <Icon name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} size={14} color={colors.primary} />}
            </TouchableOpacity>
          </View>
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
          <Text style={[styles.summaryAmount, { color: type === 'Income' ? colors.success : colors.danger }]}>
            ₹{totalAmount.toLocaleString()}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {sortedData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery.trim() ? 'No matching results found' : 'No data found for this period'}
              </Text>
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

      {/* Year Picker Modal */}
      <Modal visible={showYearPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Year</Text>
            {years.map((y) => (
              <TouchableOpacity
                key={y}
                style={styles.pickerItem}
                onPress={() => {
                  setYear(y);
                  setShowYearPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: y === year ? colors.primary : colors.text }]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Living Cost Config Modal */}
      <Modal visible={showConfig} animationType="slide">
          <View style={[styles.fullModal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowConfig(false)} style={styles.backButton}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text, flex: 1, textAlign: 'center' }]}>Configure Living Costs</Text>
              <View style={{ width: 32 }} />
            </View>

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
              contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
              columnWrapperStyle={{ justifyContent: 'flex-start', gap: 8 }}
            />
          </View>
      </Modal>

      {/* Drill Down Modal */}
      <Modal visible={showDrillDown} animationType="slide">
        <View style={[styles.fullModal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowDrillDown(false)} style={styles.backButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, flex: 1, textAlign: 'center' }]}>{drillDownTitle}</Text>
            <View style={{ width: 32 }} />
          </View>
          <FlatList
            data={drillDownData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <TransactionCard transaction={item} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No transactions found</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  configButton: { padding: 4 },
  selectors: { paddingHorizontal: 16, marginBottom: 16, paddingTop: 12 },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10
  },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  dateSelectors: { flexDirection: 'row', gap: 12 },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
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
  summaryRow: {
    flexDirection: 'row',
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
  emptyText: { marginTop: 16, fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pickerContainer: { width: width * 0.8, maxHeight: 400, borderRadius: 20, padding: 20 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 12, alignItems: 'center' },
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
  sortControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
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
