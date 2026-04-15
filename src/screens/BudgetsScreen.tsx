import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getBudgets, getBudgetSpending, getTransactionsByDateRange, getMinTransactionYear } from '../db/queries';
import { Budget, Transaction } from '../models/types';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, startOfMonth, endOfMonth, isSameMonth, differenceInDays, getYear, getMonth } from 'date-fns';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

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
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Budgets</Text>
          {lastSyncTime ? (
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Synced: {lastSyncTime}</Text>
          ) : null}
        </View>
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
      setData(enriched);
      
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
  }, [loadData]);

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

  const renderItem = ({ item }: { item: EnrichedBudget }) => (
    <BudgetCard
      name={item.name}
      amount={item.amount}
      spent={item.spent}
      startDateText={format(monthStart, 'MMM d')}
      endDateText={format(monthEnd, 'MMM d')}
      isCurrentMonth={isCurrentMonthSelected}
      daysRemaining={daysRemaining}
      onPress={() => handleCardPress(item)}
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

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMonthPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Month</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Picker Modal */}
      <Modal visible={showYearPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowYearPicker(false)}>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card, maxHeight: 350 }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Year</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Transactions Drill Down Modal */}
      <Modal visible={showDrillDown} animationType="slide">
        <View style={[styles.fullModal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={styles.drillHeader}>
            <TouchableOpacity onPress={() => setShowDrillDown(false)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.drillTitleInfo}>
              <Text style={[styles.drillTitle, { color: colors.text }]}>{drillDownTitle}</Text>
              <Text style={[styles.drillSub, { color: colors.textSecondary }]}>
                {format(selectedDate, 'MMMM yyyy')}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

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
      </Modal>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: width * 0.8,
    maxHeight: 450,
    borderRadius: 24,
    padding: 24,
    elevation: 5,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
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
  fullModal: {
    flex: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillTitleInfo: {
    flex: 1,
    alignItems: 'center',
  },
  drillTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  drillSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyDrill: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
