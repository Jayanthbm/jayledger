import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { needsTransactionSync, syncTransactions } from '../services/syncService';
import { Transaction, Category, Payee, QuickTransaction } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TransactionCard } from '../components/TransactionCard';
import { BottomSheet } from '../components/BottomSheet';
import { SearchBar } from '../components/SearchBar';
import { getCategories, getPayees, deleteTransactionAsync, getQuickTransactions, getMonthlyFilteredStats } from '../db/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRelativeTime } from '../utils/dateUtils';

interface FilterSelectorProps {
  type: 'Category' | 'Payee';
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  payees: Payee[];
  selectedItems: string[];
  tempSelectedItems: string[];
  setTempSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  onApply: (selected: string[]) => void;
  colors: any;
  modalSearch: string;
  setModalSearch: (text: string) => void;
  formatIconName: (name: string) => string;
}

const FilterSelector = React.memo(({
  type, visible, onClose, categories, payees,
  selectedItems, tempSelectedItems, setTempSelectedItems,
  onApply, colors, modalSearch, setModalSearch, formatIconName
}: FilterSelectorProps) => {
  const data = (type === 'Category' ? categories : payees).filter(item =>
    item.name.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const toggleTempSelection = (id: string) => {
    setTempSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`Select ${type === 'Category' ? 'Categories' : 'Payees'}`}
    >
      <View style={{ paddingBottom: 16 }}>
        <SearchBar
          value={modalSearch}
          onChangeText={setModalSearch}
          placeholder={`Search ${type}...`}
          size="medium"
          onClear={() => setModalSearch('')}
        />
      </View>

          <FlatList
            data={data as any[]}
            keyExtractor={item => item.id}
            numColumns={4}
            renderItem={({ item }) => {
              const isSelected = tempSelectedItems.includes(item.id);
              return (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => toggleTempSelection(item.id)}
                >
                  <View style={[
                    styles.gridIconBox,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border
                    }
                  ]}>
                    <Icon
                      name={formatIconName((item as any).app_icon || (type === 'Category' ? 'category' : 'person')) as any}
                      size={24}
                      color={isSelected ? 'white' : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[styles.gridLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          <TouchableOpacity
            style={[styles.modalDone, { backgroundColor: colors.primary }]}
            onPress={() => onApply(tempSelectedItems)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Apply Filters</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
});

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
  colors: any;
}

const DeleteConfirmModal = React.memo(({ transaction, onCancel, onConfirm, colors }: DeleteConfirmModalProps) => (
  <BottomSheet
    visible={!!transaction}
    onClose={onCancel}
    title="Delete Transaction?"
  >
    <View style={{ paddingBottom: 10 }}>
        <View style={styles.deleteHeader}>
          <View style={[styles.deleteIconBg, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="delete-outline" size={28} color={colors.danger} />
          </View>
          <Text style={[styles.deleteSub, { color: colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 16 }]}>This action cannot be undone. Are you sure you want to delete this transaction?</Text>
        </View>

        <View style={[styles.deleteActions, { marginTop: 24 }]}>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.danger, borderRadius: 16, height: 56 }]}
            onPress={onConfirm}
          >
            <Text style={styles.deleteBtnText}>Confirm Delete</Text>
          </TouchableOpacity>
        </View>
    </View>
  </BottomSheet>
));

type FlashListItem = (Transaction & { itemType: 'transaction' }) | { itemType: 'header', date: string, total: number, transactions: Transaction[] };

const TypedFlashList = FlashList as any;

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [listData, setListData] = useState<FlashListItem[]>([]);
  const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [totalFiltered, setTotalFiltered] = useState(0);
  const listRef = useRef<any>(null);

  const scrollToTop = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
      // If already at top, try to scroll slightly then back, or just rely on standard behavior
    }
  }, []);

  // Stats Breakdown State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsBreakdown, setStatsBreakdown] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]);
  const [tempSelectedCats, setTempSelectedCats] = useState<string[]>([]);
  const [tempSelectedPayees, setTempSelectedPayees] = useState<string[]>([]);

  // Master data for filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showFilterModal, setShowFilterModal] = useState<'Category' | 'Payee' | null>(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [quickTransactions, setQuickTransactions] = useState<QuickTransaction[]>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const route = navigation.getState().routes[navigation.getState().index];
  const params = route.params as any;

  const loadFilterData = useCallback(async () => {
    if (!session?.user?.id) return;
    const [cats, p] = await Promise.all([
      getCategories(session.user.id),
      getPayees(session.user.id)
    ]);
    setCategories(cats);
    setPayees(p);
  }, [session?.user?.id]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const db = getDb();

    let query = `SELECT * FROM transactions WHERE user_id = '${session.user.id}' AND deleted = 0`;

    // Search logic
    if (search.trim()) {
      const s = search.trim().replace(/'/g, "''");
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        query += ` AND amount = ${s}`;
      } else {
        query += ` AND (description LIKE '%${s}%' OR CAST(amount AS TEXT) LIKE '%${s}%')`;
      }
    }

    // Filter logic
    if (selectedCats.length > 0) {
      const catIdsString = selectedCats.map(id => `'${id}'`).join(',');
      query += ` AND category_id IN (${catIdsString})`;
    }

    if (selectedPayees.length > 0) {
      const payeeIdsString = selectedPayees.map(id => `'${id}'`).join(',');
      query += ` AND payee_id IN (${payeeIdsString})`;
    }

    if (startDate) {
      query += ` AND date >= '${startDate}'`;
    }
    if (endDate) {
      query += ` AND date <= '${endDate}'`;
    }

    query += ` ORDER BY date DESC, transaction_timestamp DESC`;

    const rows = await db.getAllAsync<Transaction>(query);

    const grouped = rows.reduce((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = { date: tx.date, total: 0, transactions: [] };
      acc[tx.date].transactions.push(tx);
      acc[tx.date].total += (tx.type === 'Income' ? tx.amount : -tx.amount);
      return acc;
    }, {} as Record<string, { date: string, total: number, transactions: Transaction[] }>);

    const flattened: any[] = [];
    const stickyIndices: number[] = [];
    let currentTotal = 0;

    Object.values(grouped).forEach(group => {
      stickyIndices.push(flattened.length);
      flattened.push({ itemType: 'header', ...group });
      group.transactions.forEach((tx: any) => {
        flattened.push({ itemType: 'transaction', ...tx });
        currentTotal += (tx.type === 'Income' ? tx.amount : -tx.amount);
      });
    });

    setListData(flattened);
    setStickyHeaderIndices(stickyIndices);
    setTotalFiltered(currentTotal);
    setLoading(false);
  }, [session?.user?.id, search, selectedCats, selectedPayees, startDate, endDate]);

  const loadStatsBreakdown = async () => {
    if (!session?.user?.id) return;
    setLoadingStats(true);
    setShowStatsModal(true);
    try {
      const stats = await getMonthlyFilteredStats(session.user.id, selectedCats, selectedPayees, search);
      setStatsBreakdown(stats);
    } catch (e) {
      console.error("Error loading stats breakdown:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncTransactions(session.user.id, true);
      const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
      if (lastTxSync) {
        setLastSyncTime(getRelativeTime(parseInt(lastTxSync)));
      }
      loadData();
    } catch (e) {
      console.error("Manual sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [session?.user?.id, isSyncing, loadData]);

  useEffect(() => {
    if (params?.initialSelectedCats) {
      setSelectedCats(params.initialSelectedCats);
      setSelectedPayees([]); // Clear payees if we are filtering by category
    }
    if (params?.initialSelectedPayees) {
      setSelectedPayees(params.initialSelectedPayees);
      setSelectedCats([]); // Clear categories if we are filtering by payee
    }
    if (params?.initialStartDate) {
      setStartDate(params.initialStartDate);
    }
    if (params?.initialEndDate) {
      setEndDate(params.initialEndDate);
    }
  }, [params]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={{ alignItems: 'flex-start' }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Transactions</Text>
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
            <Icon name="refresh" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isSyncing, colors.text, colors.textSecondary, colors.primary, lastSyncTime, handleManualSync]);

  useFocusEffect(
    useCallback(() => {
      const initSync = async () => {
        if (!session?.user?.id) return;

        // Initial check for last tx sync time
        const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
        if (lastTxSync) {
          setLastSyncTime(getRelativeTime(parseInt(lastTxSync)));
        }

        const needsSync = await needsTransactionSync(session.user.id);
        if (needsSync) {
          setIsSyncing(true);
          await syncTransactions(session.user.id, true);
          setIsSyncing(false);

          const updatedLastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
          if (updatedLastTxSync) {
            setLastSyncTime(getRelativeTime(parseInt(updatedLastTxSync)));
          }
          loadData();
        }
      };

      loadData();
      loadFilterData();
      const loadQuick = async () => {
        if (session?.user?.id) {
          const qts = await getQuickTransactions(session.user.id);
          setQuickTransactions(qts);
        }
      };
      loadQuick();
      initSync();
    }, [session?.user?.id, loadData, loadFilterData])
  );

  const handleDeleteTransaction = async (tx: Transaction) => {
    setDeleteConfirmTx(tx);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTx || !session?.user?.id) return;
    await deleteTransactionAsync(deleteConfirmTx.id, session.user.id);
    setDeleteConfirmTx(null);
    loadData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    navigation.navigate('AddTransaction', { transaction: tx });
  };

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    if (showFilterModal === 'Category') {
      setTempSelectedCats([...selectedCats]);
    } else if (showFilterModal === 'Payee') {
      setTempSelectedPayees([...selectedPayees]);
    }
  }, [showFilterModal, selectedCats, selectedPayees]);

  const handleRefresh = async () => {
    if (!session?.user?.id) return;
    setRefreshing(true);
    await syncTransactions(session.user.id, true);
    const lastTxSync = await AsyncStorage.getItem(`@last_sync_transactions_${session.user.id}`);
    if (lastTxSync) {
      setLastSyncTime(getRelativeTime(parseInt(lastTxSync)));
    }
    await loadData();
    setRefreshing(false);
  };

  const handleFilterCategory = (catId: string) => {
    setSelectedCats([catId]);
    setSearch('');
  };

  const handleFilterPayee = (payeeId: string | null) => {
    if (payeeId) {
      setSelectedPayees([payeeId]);
      setSearch('');
    }
  };

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedCats([]);
    setSelectedPayees([]);
    setStartDate(null);
    setEndDate(null);
  }, []);

  const renderItem = useCallback(({ item }: { item: Transaction }) => {
    return (
      <TransactionCard
        transaction={item}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onFilterCategory={handleFilterCategory}
        onFilterPayee={handleFilterPayee}
      />
    );
  }, [session?.user?.id]);

  const formatIconName = useCallback((name: string) => {
    if (!name) return 'category';
    let formatted = name.trim();
    if (formatted.startsWith('Md')) {
      formatted = formatted.substring(2);
      formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    return formatted;
  }, []);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          size="medium"
          onClear={() => setSearch('')}
        />
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <View style={[styles.filterChip, {
            backgroundColor: selectedCats.length > 0 ? colors.primary + '15' : 'transparent',
            borderColor: selectedCats.length > 0 ? colors.primary : colors.border
          }]}>
            <TouchableOpacity
              onPress={() => setShowFilterModal('Category')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="category" size={16} color={selectedCats.length > 0 ? colors.primary : colors.textSecondary} style={{marginRight: 4}} />
              <Text style={[styles.filterChipText, { color: selectedCats.length > 0 ? colors.primary : colors.textSecondary }]}>
                {selectedCats.length > 0 ? `${selectedCats.length} Mixed` : 'Categories'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={selectedCats.length > 0 ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
            {selectedCats.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedCats([])} style={styles.smallClose}>
                <Icon name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.filterChip, {
            backgroundColor: selectedPayees.length > 0 ? colors.primary + '15' : 'transparent',
            borderColor: selectedPayees.length > 0 ? colors.primary : colors.border
          }]}>
            <TouchableOpacity
              onPress={() => setShowFilterModal('Payee')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="person" size={16} color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary} style={{marginRight: 4}} />
              <Text style={[styles.filterChipText, { color: selectedPayees.length > 0 ? colors.primary : colors.textSecondary }]}>
                {selectedPayees.length > 0 ? `${selectedPayees.length} Payees` : 'Payees'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
            {selectedPayees.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedPayees([])} style={styles.smallClose}>
                <Icon name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter Stats Display */}
      {listData.length > 0 && (selectedCats.length > 0 || selectedPayees.length > 0) && (
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statsPill, { backgroundColor: colors.card, borderColor: (totalFiltered >= 0 ? colors.success : colors.danger) + '40' }]}
            onPress={loadStatsBreakdown}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>FILTER TOTAL</Text>
               <Text style={[styles.statsValue, { color: totalFiltered >= 0 ? colors.success : colors.danger }]}>
                 {totalFiltered >= 0 ? '+' : ''}₹{totalFiltered.toLocaleString()}
               </Text>
               <Icon name="bar-chart" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <TypedFlashList
        ref={listRef}
        data={listData}
        keyExtractor={(item: FlashListItem, index: number) => item.itemType === 'header' ? `header-${item.date}` : item.id}
        renderItem={({ item }: { item: FlashListItem }) => {
          if (item.itemType === 'header') {
            return (
              <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
                  {format(new Date(item.date), 'MMM dd, yyyy')}
                </Text>
                <Text style={[styles.headerTotal, { color: item.total >= 0 ? colors.success : colors.danger }]}>
                  {item.total >= 0 ? '+' : ''}₹{item.total.toLocaleString()}
                </Text>
              </View>
            );
          }
          return (
            <TransactionCard
              transaction={item}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onFilterCategory={handleFilterCategory}
              onFilterPayee={handleFilterPayee}
            />
          );
        }}
        getItemType={(item: FlashListItem) => item.itemType}
        stickyHeaderIndices={stickyHeaderIndices}
        estimatedItemSize={80}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={loading ? <ActivityIndicator style={{marginTop: 40}} color={colors.primary} /> : (
            <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.border + '15' }]}>
              <Icon name="search-off" size={48} color={colors.border} />
            </View>
            <Text style={[styles.emptyHeader, { color: colors.text }]}>No transactions found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try adjusting your filters or search terms</Text>

            <TouchableOpacity
              style={[styles.clearFilterBtn, { backgroundColor: colors.primary }]}
              onPress={clearFilters}
            >
              <Text style={styles.clearFilterBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
            </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <FilterSelector
        type="Category"
        visible={showFilterModal === 'Category'}
        onClose={() => setShowFilterModal(null)}
        categories={categories}
        payees={payees}
        selectedItems={selectedCats}
        tempSelectedItems={tempSelectedCats}
        setTempSelectedItems={setTempSelectedCats}
        onApply={(selected) => { setSelectedCats(selected); setShowFilterModal(null); setModalSearch(''); }}
        colors={colors}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        formatIconName={formatIconName}
      />
      <FilterSelector
        type="Payee"
        visible={showFilterModal === 'Payee'}
        onClose={() => setShowFilterModal(null)}
        categories={categories}
        payees={payees}
        selectedItems={selectedPayees}
        tempSelectedItems={tempSelectedPayees}
        setTempSelectedItems={setTempSelectedPayees}
        onApply={(selected) => { setSelectedPayees(selected); setShowFilterModal(null); setModalSearch(''); }}
        colors={colors}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        formatIconName={formatIconName}
      />
      <DeleteConfirmModal
        transaction={deleteConfirmTx}
        onCancel={() => setDeleteConfirmTx(null)}
        onConfirm={confirmDelete}
        colors={colors}
      />

      {/* Quick Transaction Modal */}
      <BottomSheet
        visible={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        title="Quick Transactions"
      >

                <FlatList
                    data={quickTransactions}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.quickItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => {
                          setShowQuickModal(false);
                          navigation.navigate('AddTransaction', { quickTransaction: item });
                        }}
                      >
                        <View style={[styles.quickIcon, { backgroundColor: item.type === 'Income' ? colors.success + '20' : colors.danger + '20' }]}>
                          <Icon name={item.type === 'Income' ? 'add' : 'remove'} size={24} color={item.type === 'Income' ? colors.success : colors.danger} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickName, { color: colors.text }]}>{item.name}</Text>
                          {item.amount ? <Text style={{ color: colors.textSecondary, fontSize: 13 }}>₹{item.amount.toLocaleString()}</Text> : null}
                        </View>
                        <Icon name="chevron-right" size={24} color={colors.border} />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: colors.textSecondary }}>No templates found. Define some in Settings.</Text>
                      </View>
                    }
                />
      </BottomSheet>

      {/* Add FABs */}
      <TouchableOpacity
        style={[styles.quickFab, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setShowQuickModal(true)}
      >
        <Icon name="bolt" size={28} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Stats Breakdown Bottom Sheet */}
      <BottomSheet
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Last 5 Months"
      >

                {loadingStats ? (
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                  <ScrollView>
                    {statsBreakdown.map((s, idx) => (
                      <View key={s.month} style={[styles.statItem, { borderBottomWidth: idx === statsBreakdown.length - 1 ? 0 : 1, borderColor: colors.border }]}>
                         <Text style={[styles.statMonth, { color: colors.text }]}>{s.month}</Text>
                         <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.statsValue, { color: (s.income - s.expense) >= 0 ? colors.success : colors.danger, fontSize: 18 }]}>
                               {(s.income - s.expense) >= 0 ? '+' : ''}₹{(s.income - s.expense).toLocaleString()}
                            </Text>
                         </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 16, paddingBottom: 8 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'center', gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: 'transparent'
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  smallClose: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clearBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  statsPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerDate: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  headerTotal: {
    fontSize: 13,
    fontWeight: '800',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDone: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteSub: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deleteActions: {
    width: '100%',
    gap: 12,
  },
  deleteBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelDeleteBtn: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
    paddingHorizontal: 10,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  clearFilterBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearFilterBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 120 : 24,
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
  },
  quickFab: {
    position: 'absolute',
    right: 24,
    bottom: Platform.OS === 'ios' ? 200 : 104,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1.5,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statMonth: {
    fontSize: 16,
    fontWeight: '700',
  },
  statTotal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
