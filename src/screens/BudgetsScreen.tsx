import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Dimensions, TextInput, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getBudgets, getBudgetSpending, getTransactionsByDateRange, getMinTransactionYear, addBudget, updateBudget, deleteBudget, getCategories } from '../db/queries';
import { BottomSheet } from '../components/BottomSheet';
import { Budget, Transaction, Category } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, startOfMonth, endOfMonth, isSameMonth, differenceInDays, getYear, getMonth, getDaysInMonth } from 'date-fns';
import { BudgetCard } from '../components/BudgetCard';
import { TransactionCard } from '../components/TransactionCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { syncBudgets } from '../services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRelativeTime } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

interface EnrichedBudget extends Budget {
  spent: number;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYearNum = new Date().getFullYear();
const currentMonthNum = new Date().getMonth();

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<EnrichedBudget[]>([]);
  const [years, setYears] = useState<string[]>([currentYearNum.toString()]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const [sortMode, setSortMode] = useState<'name' | 'amount' | 'spent' | 'remaining'>('name');
  const [showSortModal, setShowSortModal] = useState(false);

  // Add/Edit State
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    interval: 'Monthly',
    categories: [] as string[],
    logo: 'account-balance-wallet'
  });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncBudgets(session.user.id);
      const lastSync = await AsyncStorage.getItem(`@last_sync_budgets_${session.user.id}`);
      if (lastSync) {
        setLastSyncTime(getRelativeTime(parseInt(lastSync)));
      }
      loadData();
    } catch (e) {
      console.error("Manual sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [session?.user?.id, isSyncing]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={scrollToTop}
          style={{ alignItems: 'flex-start' }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Budgets</Text>
          {lastSyncTime ? (
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Synced: {lastSyncTime}</Text>
          ) : null}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
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
  }, [navigation, isSyncing, colors.text, colors.textSecondary, colors.primary, lastSyncTime, handleManualSync]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Drill down state
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  const isCurrentMonthSelected = useMemo(() => {
    return isSameMonth(selectedDate, new Date());
  }, [selectedDate]);

  const monthStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const monthEnd = useMemo(() => endOfMonth(selectedDate), [selectedDate]);

  const startDateStr = format(monthStart, 'yyyy-MM-dd');
  const endDateStr = format(monthEnd, 'yyyy-MM-dd');

  const daysRemaining = useMemo(() => {
    const today = new Date();
    if (!isCurrentMonthSelected) return 0;
    return differenceInDays(monthEnd, today) + 1;
  }, [monthEnd, isCurrentMonthSelected]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const budgets = await getBudgets(session.user.id);
      const enriched: EnrichedBudget[] = await Promise.all(budgets.map(async (b) => {
        let categoryIds: string[] = [];
        try {
          categoryIds = JSON.parse(b.categories);
        } catch (e) {
          console.error("Error parsing budget categories:", e);
        }
        const spent = await getBudgetSpending(session.user.id, categoryIds, startDateStr, endDateStr);
        return { ...b, spent };
      }));

      const sorted = [...enriched].sort((a, b) => {
        if (sortMode === 'name') return a.name.localeCompare(b.name);
        if (sortMode === 'amount') return b.amount - a.amount;
        if (sortMode === 'spent') return b.spent - a.spent;
        if (sortMode === 'remaining') return (b.amount - b.spent) - (a.amount - a.spent);
        return 0;
      });

      setData(sorted);

      const lastSync = await AsyncStorage.getItem(`@last_sync_budgets_${session.user.id}`);
      if (lastSync) {
        setLastSyncTime(getRelativeTime(parseInt(lastSync)));
      }

      if (enriched.length === 0) {
        // Only run sync on mount if data is truly empty
        // We'll use a check to avoid infinite loops
        const alreadyChecked = await AsyncStorage.getItem(`@initial_budget_sync_checked_${session.user.id}`);
        if (!alreadyChecked) {
          setIsSyncing(true);
          await syncBudgets(session.user.id);
          await AsyncStorage.setItem(`@initial_budget_sync_checked_${session.user.id}`, 'true');
          const lastSyncUpdated = await AsyncStorage.getItem(`@last_sync_budgets_${session.user.id}`);
          if (lastSyncUpdated) {
            setLastSyncTime(getRelativeTime(parseInt(lastSyncUpdated)));
          }
          const updatedBudgets = await getBudgets(session.user.id);
          const updatedEnriched: EnrichedBudget[] = await Promise.all(updatedBudgets.map(async (b) => {
            let categoryIds: string[] = [];
            try { categoryIds = JSON.parse(b.categories); } catch (e) {}
            const spent = await getBudgetSpending(session.user.id, categoryIds, startDateStr, endDateStr);
            return { ...b, spent };
          }));
          setData(updatedEnriched);
          setIsSyncing(false);
        }
      }

      // Dynamic Years
      const minYear = await getMinTransactionYear(session.user.id);
      const generatedYears = [];
      for (let y = currentYearNum; y >= minYear; y--) {
        generatedYears.push(y.toString());
      }
      setYears(generatedYears);
    } catch (e) {
      console.error("Load Budgets Error:", e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, startDateStr, endDateStr]);

  useEffect(() => {
    loadData();
    const fetchCats = async () => {
      if (session?.user?.id) {
        const cats = await getCategories(session.user.id);
        setAllCategories(cats.filter(c => c.type === 'Expense'));
      }
    };
    fetchCats();
  }, [loadData, session?.user?.id]);

  const handleCurrentMonth = () => setSelectedDate(new Date());
  const handleCardPress = async (budget: EnrichedBudget) => {
    if (!session?.user?.id) return;
    setDrillDownLoading(true);
    setDrillDownTitle(budget.name);
    setShowDrillDown(true);

    try {
      let categoryIds: string[] = [];
      try {
        categoryIds = JSON.parse(budget.categories);
      } catch (e) {}

      const all = await getTransactionsByDateRange(session.user.id, startDateStr, endDateStr);
      const filtered = all.filter(t => t.category_id && categoryIds.includes(t.category_id));
      setDrillDownData(filtered);
    } catch (e) {
      console.error("Drill down error:", e);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const { todayProgress, daysInMonth } = useMemo(() => {
    const today = new Date();
    const dim = getDaysInMonth(today);
    return {
      todayProgress: (today.getDate() / dim) * 100,
      daysInMonth: dim
    };
  }, []);

  const renderItem = ({ item }: { item: EnrichedBudget }) => (
    <BudgetCard
      name={item.name}
      amount={item.amount}
      spent={item.spent}
      startDateText={format(monthStart, 'MMM d')}
      endDateText={format(monthEnd, 'MMM d')}
      isCurrentMonth={isCurrentMonthSelected}
      daysRemaining={daysRemaining}
      todayProgress={todayProgress}
      daysInMonth={daysInMonth}
      onPress={() => handleCardPress(item)}
      onLongPress={() => {
        setEditingBudget(item);
        setForm({
          name: item.name,
          amount: item.amount.toString(),
          interval: item.interval,
          categories: JSON.parse(item.categories),
          logo: item.logo
        });
        setShowAddEdit(true);
      }}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date Selector Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.dateSelectors}>
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={[styles.selectorText, { color: colors.text }]}>
              {getYear(selectedDate)}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={[styles.selectorText, { color: colors.text }]}>
              {months[getMonth(selectedDate)]}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: colors.primary + '15' }]}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialIcons name="sort" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.toolsRow}>
        {!isCurrentMonthSelected && (
          <TouchableOpacity onPress={handleCurrentMonth} style={[styles.todayBtn, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.todayText, { color: colors.primary }]}>Back to Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && data.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <MaterialIcons name="account-balance-wallet" size={64} color={colors.border} />
               <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Budgets Found</Text>
            </View>
          }
        />
      )}

      {/* Sort Modal */}
      <BottomSheet
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        title="Sort Budgets"
      >
        <View>
          {(['name', 'amount', 'spent', 'remaining'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={styles.sortItem}
              onPress={() => {
                setSortMode(mode);
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.sortBtnText, { color: sortMode === mode ? colors.primary : colors.text }]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
              {sortMode === mode && <MaterialIcons name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      {/* Transactions Drill Down Modal */}
      <BottomSheet
        visible={showDrillDown}
        onClose={() => setShowDrillDown(false)}
        title={drillDownTitle}
        subtitle={format(selectedDate, 'MMMM yyyy')}
        isFullScreen
      >
        <View>
          {drillDownLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={drillDownData}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard transaction={item} />}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
              ListEmptyComponent={
                <View style={styles.emptyDrill}>
                  <MaterialIcons name="search-off" size={64} color={colors.border} />
                  <Text style={{ textAlign: 'center', marginTop: 12, color: colors.textSecondary }}>No transactions found for this budget</Text>
                </View>
              }
            />
          )}
        </View>
      </BottomSheet>

      {/* Add/Edit Modal */}
      <BottomSheet
        visible={showAddEdit}
        onClose={() => setShowAddEdit(false)}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
        headerRight={editingBudget ? (
          <TouchableOpacity onPress={() => setDeleteConfirmId(editingBudget.id)} style={styles.deleteBtnIcon}>
            <MaterialIcons name="delete" size={24} color={colors.danger} />
          </TouchableOpacity>
        ) : undefined}
      >
        <View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>BUDGET NAME</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={form.name}
                  onChangeText={(t: string) => setForm(f => ({ ...f, name: t }))}
                  placeholder="e.g. Monthly Grocery"
                  placeholderTextColor={colors.textSecondary + '80'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>MONTHLY AMOUNT</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={form.amount}
                  onChangeText={(t: string) => setForm(f => ({ ...f, amount: t }))}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORIES</Text>
                <View style={styles.categoryGrid}>
                  {allCategories.map(cat => {
                    const isSelected = form.categories.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          const newCats = isSelected ? form.categories.filter(id => id !== cat.id) : [...form.categories, cat.id];
                          setForm(f => ({ ...f, categories: newCats }));
                        }}
                        style={[styles.catChip, {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border
                        }]}
                      >
                        <Text style={[styles.catChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                if (!session?.user?.id) return;
                const budgetData = {
                  user_id: session.user.id,
                  name: form.name,
                  amount: parseFloat(form.amount) || 0,
                  categories: JSON.stringify(form.categories),
                  interval: form.interval,
                  logo: form.logo,
                  start_date: format(new Date(), 'yyyy-MM-dd')
                };
                if (editingBudget) {
                  await updateBudget(editingBudget.id, budgetData);
                } else {
                  await addBudget(budgetData);
                }
                setShowAddEdit(false);
                loadData();
              }}
            >
              <Text style={styles.saveBtnText}>Save Budget</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
        </View>
      </BottomSheet>

      {/* Month Picker Bottom Sheet */}
      <BottomSheet
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        title="Select Month"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
          {months.map((m, i) => {
            const isFuture = getYear(selectedDate) === currentYearNum && i > currentMonthNum;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.pickerItem, isFuture && { opacity: 0.3 }]}
                disabled={isFuture}
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(i);
                  setSelectedDate(newDate);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: i === getMonth(selectedDate) ? colors.primary : colors.text }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* Year Picker Bottom Sheet */}
      <BottomSheet
        visible={showYearPicker}
        onClose={() => setShowYearPicker(false)}
        title="Select Year"
      >
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
          {years.map((y) => (
            <TouchableOpacity
              key={y}
              style={styles.pickerItem}
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setFullYear(parseInt(y, 10));
                setSelectedDate(newDate);
                setShowYearPicker(false);
              }}
            >
              <Text style={[styles.pickerText, { color: y === getYear(selectedDate).toString() ? colors.primary : colors.text }]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>


      {/* Delete Confirm Bottom Sheet */}
      <BottomSheet
        visible={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Budget?"
      >
        <View>
          <Text style={[styles.deleteSubText, { color: colors.textSecondary }]}>This will remove the budget target but transactions will remain.</Text>
          <View style={styles.deleteActions}>
            <TouchableOpacity
              style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]}
              onPress={async () => {
                if (deleteConfirmId) {
                  await deleteBudget(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setShowAddEdit(false);
                  loadData();
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditingBudget(null);
          setForm({ name: '', amount: '', interval: 'Monthly', categories: [], logo: 'account-balance-wallet' });
          setShowAddEdit(true);
        }}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1.5,
  },
  dateSelectorRow: {
    display: 'none',
  },
  dateSelectors: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    paddingHorizontal: 8,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sortBtn: {
    padding: 10,
    borderRadius: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  navBtn: {
    padding: 4,
  },
  toolsRow: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  todayBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  recalcText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyDrill: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteBtnIcon: {
    padding: 10,
  },
  pickerItem: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  pickerText: {
    fontSize: 17,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    fontSize: 17,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sortItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sortBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteSubText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 40 : 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  }
});
