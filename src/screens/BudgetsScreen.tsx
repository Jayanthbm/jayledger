import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import {
  addBudget,
  updateBudget,
  deleteBudget,
  getCategories,
  getMinTransactionDate,
} from '../db/queries';
import { Budget, Transaction, Category } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  differenceInDays,
  getDaysInMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { BudgetCard } from '../components/BudgetCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRelativeTime } from '../utils/dateUtils';
import {
  fetchBudgetsWithSpending,
  fetchBudgetDrillDown,
  handleBudgetSync,
  EnrichedBudget,
} from '../services/budgetService';

// Modular Components
import { BudgetHeader } from '../components/budgets/BudgetHeader';
import { BudgetSortModal } from '../components/budgets/BudgetSortModal';
import { BudgetDeleteModal } from '../components/budgets/BudgetDeleteModal';
import { BudgetDrillDownModal } from '../components/budgets/BudgetDrillDownModal';
import { BudgetAddEditModal } from '../components/budgets/BudgetAddEditModal';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';

const currentYearNum = new Date().getFullYear();

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<AppNavigation>();
  const { showToast } = useToast();

  const [data, setData] = useState<EnrichedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [minDate, setMinDate] = useState<Date>(new Date(currentYearNum, 0, 1));
  const maxDate = useMemo(() => endOfMonth(new Date()), []);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const listRef = useRef<FlatList>(null);

  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'spent' | 'remaining'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);

  // Add/Edit State
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Drill down state
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState<Transaction[]>([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const monthStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const monthEnd = useMemo(() => endOfMonth(selectedDate), [selectedDate]);
  const startDateStr = format(monthStart, 'yyyy-MM-dd');
  const endDateStr = format(monthEnd, 'yyyy-MM-dd');

  const isCurrentMonthSelected = useMemo(() => {
    return isSameMonth(selectedDate, new Date());
  }, [selectedDate]);

  const daysRemaining = useMemo(() => {
    if (!isCurrentMonthSelected) return 0;
    return differenceInDays(monthEnd, new Date()) + 1;
  }, [monthEnd, isCurrentMonthSelected]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sorted = await fetchBudgetsWithSpending(
        session.user.id,
        startDateStr,
        endDateStr,
        sortBy,
        sortAsc,
      );
      setData(sorted);

      const lastSync = await AsyncStorage.getItem(`@last_sync_budgets_${session.user.id}`);
      if (lastSync) setLastSyncTime(getRelativeTime(parseInt(lastSync)));

      if (sorted.length === 0) {
        const alreadyChecked = await AsyncStorage.getItem(
          `@initial_budget_sync_checked_${session.user.id}`,
        );
        if (!alreadyChecked) {
          setIsSyncing(true);
          await handleBudgetSync(session.user.id);
          const lastSyncUpdated = await AsyncStorage.getItem(
            `@last_sync_budgets_${session.user.id}`,
          );
          if (lastSyncUpdated) setLastSyncTime(getRelativeTime(parseInt(lastSyncUpdated)));
          const updated = await fetchBudgetsWithSpending(
            session.user.id,
            startDateStr,
            endDateStr,
            sortBy,
            sortAsc,
          );
          setData(updated);
          setIsSyncing(false);
        }
      }
    } catch (e) {
      console.error('Load Budgets Error:', e);
    } finally {
      setLoading(false);
    }
  }, [session, startDateStr, endDateStr, sortBy, sortAsc]);

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await handleBudgetSync(session.user.id);
      const lastSync = await AsyncStorage.getItem(`@last_sync_budgets_${session.user.id}`);
      if (lastSync) setLastSyncTime(getRelativeTime(parseInt(lastSync)));
      loadData();
      showToast('Budgets synced successfully', 'success');
    } catch (e) {
      console.error('Manual sync error:', e);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing, loadData, showToast]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Budgets</Text>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const init = async () => {
      if (session?.user?.id) {
        const [cats, minD] = await Promise.all([
          getCategories(session.user.id),
          getMinTransactionDate(session.user.id),
        ]);
        setAllCategories(cats.filter((c) => c.type === 'Expense'));
        if (minD) setMinDate(new Date(minD));
      }
    };
    init();

    const subscription = DeviceEventEmitter.addListener('module_refreshed', () => {
      loadData();
    });

    return () => {
      subscription.remove();
    };
  }, [loadData, session]);

  const handleCardPress = async (budget: EnrichedBudget) => {
    if (!session?.user?.id) return;
    setDrillDownLoading(true);
    setDrillDownTitle(budget.name);
    setShowDrillDown(true);
    try {
      const transactions = await fetchBudgetDrillDown(
        session.user.id,
        budget.categories,
        startDateStr,
        endDateStr,
      );
      setDrillDownData(transactions);
    } catch (e) {
      console.error('Drill down error:', e);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const { todayProgress, daysInMonth } = useMemo(() => {
    const today = new Date();
    const dim = getDaysInMonth(today);
    return { todayProgress: (today.getDate() / dim) * 100, daysInMonth: dim };
  }, []);

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <BudgetHeader
        selectedDate={selectedDate}
        minDate={minDate}
        maxDate={maxDate}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onPrev={() => setSelectedDate(subMonths(selectedDate, 1))}
        onNext={() => setSelectedDate(addMonths(selectedDate, 1))}
        onYearMonthChange={setSelectedDate}
        onSortPress={() => setShowSortModal(true)}
      />

      <View style={styles.toolsRow}>
        {!isCurrentMonthSelected && (
          <TouchableOpacity
            onPress={() => setSelectedDate(new Date())}
            style={[styles.todayBtn, { backgroundColor: colors.primary + '15' }]}
          >
            <Text style={[styles.todayText, { color: colors.primary }]}>Back to Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && data.length === 0 ? (
        <View style={common.flexCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
                setShowAddEdit(true);
              }}
            />
          )}
          contentContainerStyle={common.pb40}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="account-balance-wallet" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No Budgets Found
              </Text>
            </View>
          }
        />
      )}

      <BudgetSortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(mode, asc) => {
          setSortBy(mode);
          setSortAsc(asc);
        }}
      />

      <BudgetDrillDownModal
        visible={showDrillDown}
        onClose={() => setShowDrillDown(false)}
        title={drillDownTitle}
        subtitle={format(selectedDate, 'MMMM yyyy')}
        loading={drillDownLoading}
        transactions={drillDownData}
      />

      <BudgetAddEditModal
        visible={showAddEdit}
        onClose={() => setShowAddEdit(false)}
        editingBudget={editingBudget}
        allCategories={allCategories}
        onDeleteRequest={setDeleteConfirmId}
        onSave={async (budgetData) => {
          if (!session?.user?.id) return;
          const finalData = { ...budgetData, user_id: session.user.id };
          if (editingBudget) await updateBudget(editingBudget.id, finalData);
          else await addBudget(finalData);
          setShowAddEdit(false);
          loadData();
          showToast(`Budget ${editingBudget ? 'updated' : 'added'} successfully`, 'success');
        }}
      />

      <BudgetDeleteModal
        visible={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={async () => {
          if (deleteConfirmId) {
            await deleteBudget(deleteConfirmId);
            setDeleteConfirmId(null);
            setShowAddEdit(false);
            loadData();
            showToast('Budget deleted', 'success');
          }
        }}
      />

      <FloatingActionButton
        onPress={() => {
          setEditingBudget(null);
          setShowAddEdit(true);
        }}
        iconName="add"
        backgroundColor={colors.primary}
        style={styles.fab}
        iconSize={32}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolsRow: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  fab: {
    bottom: Platform.OS === 'ios' ? 40 : 24,
  },
});
