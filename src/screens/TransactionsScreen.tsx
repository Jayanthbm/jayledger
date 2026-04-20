import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Transaction, QuickTransaction } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TransactionCard } from '../components/TransactionCard';
import { SearchBar } from '../components/SearchBar';
import { deleteTransactionAsync, getQuickTransactions } from '../db/queries';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { FlashListItem } from '../utils/dataMappers';
import { TransactionFilterSelector } from '../components/transactions/TransactionFilterSelector';
import { TransactionDeleteModal } from '../components/transactions/TransactionDeleteModal';
import { TransactionQuickModal } from '../components/transactions/TransactionQuickModal';
import { TransactionStatsModal } from '../components/transactions/TransactionStatsModal';
import { TransactionSectionHeader } from '../components/transactions/TransactionSectionHeader';
import { syncTransactions } from '../services/syncService';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { MainTabParamList, RootStackParamList } from '../navigation/navigationTypes';
import { common } from '../styles/common';
import { DataErrorBoundary } from '../components/common/ErrorBoundaries';
import { SyncFeedback } from '../components/common/SyncFeedback';
import { FeedbackPlaceholder } from '../components/common/FeedbackPlaceholder';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useTransactionSync } from '../hooks/useTransactionSync';

import { formatCurrency } from '../utils/formatters';
import { logger } from '../utils/logger';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Transactions'>>();
  const params = route.params;

  const filters = useTransactionFilters({ session, params });
  const { isSyncing, lastSyncTime, handleManualSync } = useTransactionSync(
    session,
    filters.loadData,
  );
  const listRef = useRef<FlashListRef<FlashListItem> | null>(null);

  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);

  const [quickTransactions, setQuickTransactions] = useState<QuickTransaction[]>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);

  const {
    loading,
    listData,
    stickyHeaderIndices,
    totalFiltered,
    showStatsModal,
    setShowStatsModal,
    statsBreakdown,
    loadingStats,
    search,
    setSearch,
    selectedCats,
    setSelectedCats,
    selectedPayees,
    setSelectedPayees,
    tempSelectedCats,
    setTempSelectedCats,
    tempSelectedPayees,
    setTempSelectedPayees,
    categories,
    payees,
    showFilterModal,
    setShowFilterModal,
    modalSearch,
    setModalSearch,
    startDate,
    endDate,
    loadFilterData,
    loadData,
    loadStatsBreakdown,
    handleFilterCategory,
    handleFilterPayee,
    clearFilters,
  } = filters;

  const scrollToTop = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={scrollToTop}
          style={common.headerTitleContainer}
        >
          <Text style={[common.navHeaderTitle, { color: colors.text }]}>Transactions</Text>
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
            <Icon name="refresh" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      ),
    });

    const sub = DeviceEventEmitter.addListener('module_refreshed', (data: { module: string }) => {
      if (data.module === 'Transactions') loadData();
    });
    return () => sub.remove();
  }, [
    navigation,
    isSyncing,
    colors.text,
    colors.textSecondary,
    colors.primary,
    lastSyncTime,
    handleManualSync,
    loadData,
    scrollToTop,
  ]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadData();
        loadFilterData();
        const loadQuick = async () => {
          if (session?.user?.id) {
            const qts = await getQuickTransactions(session.user.id);
            setQuickTransactions(qts);
          }
        };
        loadQuick();
      }, 0);
      return () => clearTimeout(timer);
    }, [session, loadData, loadFilterData]),
  );

  const handleDeleteTransaction = (tx: Transaction) => setDeleteConfirmTx(tx);

  const confirmDelete = async () => {
    if (!deleteConfirmTx || !session?.user?.id) return;
    await deleteTransactionAsync(deleteConfirmTx.id, session.user.id);
    syncTransactions(session.user.id, true).catch((err) =>
      logger.error('Auto-sync after deletion failed', err),
    );
    setDeleteConfirmTx(null);
    loadData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    navigation.navigate('AddTransaction', { transaction: tx });
  };

  // Auto-scroll to top when data updates due to filter changes
  useEffect(() => {
    if (listData.length > 0) {
      const timer = setTimeout(() => {
        scrollToTop();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [search, selectedCats, selectedPayees, startDate, endDate, scrollToTop, listData.length]);

  const themedStyles = useMemo(
    () => ({
      selectedFilterChip: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
      },
      inactiveFilterChip: {
        backgroundColor: 'transparent',
        borderColor: colors.border,
      },
    }),
    [colors.border, colors.primary],
  );

  return (
    <DataErrorBoundary colors={colors} onReset={loadData}>
      <View style={[common.flex1, { backgroundColor: colors.background }]}>
        <SyncFeedback isSyncing={isSyncing} onRetry={handleManualSync} />
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            size="medium"
            onClear={() => setSearch('')}
          />
        </View>

        <View style={styles.filterRow}>
          <View style={styles.row}>
            <View
              style={[
                styles.filterChip,
                selectedCats.length > 0
                  ? themedStyles.selectedFilterChip
                  : themedStyles.inactiveFilterChip,
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowFilterModal('Category')}
                style={styles.filterChipButton}
              >
                <Icon
                  name="category"
                  size={16}
                  color={selectedCats.length > 0 ? colors.primary : colors.textSecondary}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedCats.length > 0 ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {selectedCats.length > 0 ? `${selectedCats.length} Mixed` : 'Categories'}
                </Text>
                <Icon
                  name="arrow-drop-down"
                  size={20}
                  color={selectedCats.length > 0 ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
              {selectedCats.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCats([]);
                    setTempSelectedCats([]);
                  }}
                  style={styles.smallClose}
                >
                  <Icon name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.filterChip,
                selectedPayees.length > 0
                  ? themedStyles.selectedFilterChip
                  : themedStyles.inactiveFilterChip,
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowFilterModal('Payee')}
                style={styles.filterChipButton}
              >
                <Icon
                  name="person"
                  size={16}
                  color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary}
                  style={common.mr4}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedPayees.length > 0 ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {selectedPayees.length > 0 ? `${selectedPayees.length} Payees` : 'Payees'}
                </Text>
                <Icon
                  name="arrow-drop-down"
                  size={20}
                  color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
              {selectedPayees.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedPayees([]);
                    setTempSelectedPayees([]);
                  }}
                  style={styles.smallClose}
                >
                  <Icon name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {search.length > 0 && listData.length === 0 && !loading && (
          <View style={common.ph16}>
            <View
              style={[
                common.noResultsSearchContainer,
                { borderColor: colors.border, backgroundColor: colors.card + '50' },
              ]}
            >
              <Text style={[common.noResultsSearchText, { color: colors.textSecondary }]}>
                No transactions found matching &quot;{search}&quot;
              </Text>
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={[common.clearSearchButton, { backgroundColor: colors.primary + '15' }]}
              >
                <Text style={[common.clearSearchText, { color: colors.primary }]}>
                  Clear Search
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {listData.length > 0 && (selectedCats.length > 0 || selectedPayees.length > 0) && (
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[
                styles.statsPill,
                {
                  backgroundColor: colors.card,
                  borderColor: (totalFiltered >= 0 ? colors.success : colors.danger) + '40',
                },
              ]}
              onPress={loadStatsBreakdown}
            >
              <View style={styles.statsPillContent}>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                  FILTER TOTAL
                </Text>
                <Text
                  style={[
                    styles.statsValue,
                    { color: totalFiltered >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {totalFiltered >= 0 ? '+' : ''}
                  {formatCurrency(totalFiltered)}
                </Text>
                <Icon name="bar-chart" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <FlashList
          {...({
            ref: listRef,
            data: listData,
            keyExtractor: (item: FlashListItem) =>
              item.itemType === 'header' ? `header-${item.date}` : item.id,
            estimatedItemSize: 100,
            keyboardShouldPersistTaps: 'always',
            renderItem: ({ item }: { item: FlashListItem }) => {
              if (item.itemType === 'header') {
                return (
                  <TransactionSectionHeader date={item.date} total={item.total} colors={colors} />
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
            },
            getItemType: (item: FlashListItem) => item.itemType,
            stickyHeaderIndices: stickyHeaderIndices,
            ListEmptyComponent: loading ? (
              <ActivityIndicator style={styles.emptyLoader} color={colors.primary} />
            ) : search.length > 0 ? null : ( // When searching, we show the high-visibility caption instead of this centered placeholder
              <FeedbackPlaceholder
                title="No transactions found"
                subtitle="Try adjusting your filters or search terms"
                actionLabel="Clear All Filters"
                onAction={clearFilters}
              />
            ),
            contentContainerStyle: styles.listContent,
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          } as any)}
        />

        <TransactionFilterSelector
          type="Category"
          visible={showFilterModal === 'Category'}
          onClose={() => setShowFilterModal(null)}
          categories={categories}
          payees={payees}
          tempSelectedItems={tempSelectedCats}
          setTempSelectedItems={setTempSelectedCats}
          onApply={(selected) => {
            setSelectedCats(selected);
            setShowFilterModal(null);
            setModalSearch('');
          }}
          colors={colors}
          modalSearch={modalSearch}
          setModalSearch={setModalSearch}
        />
        <TransactionFilterSelector
          type="Payee"
          visible={showFilterModal === 'Payee'}
          onClose={() => setShowFilterModal(null)}
          categories={categories}
          payees={payees}
          tempSelectedItems={tempSelectedPayees}
          setTempSelectedItems={setTempSelectedPayees}
          onApply={(selected) => {
            setSelectedPayees(selected);
            setShowFilterModal(null);
            setModalSearch('');
          }}
          colors={colors}
          modalSearch={modalSearch}
          setModalSearch={setModalSearch}
        />
        <TransactionDeleteModal
          transaction={deleteConfirmTx}
          onCancel={() => setDeleteConfirmTx(null)}
          onConfirm={confirmDelete}
        />
        <TransactionQuickModal
          visible={showQuickModal}
          onClose={() => setShowQuickModal(false)}
          quickTransactions={quickTransactions}
          onSelect={(item) => {
            setShowQuickModal(false);
            navigation.navigate('AddTransaction', { quickTransaction: item });
          }}
        />

        <TouchableOpacity
          style={[styles.quickFab, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowQuickModal(true)}
        >
          <Icon name="bolt" size={28} color={colors.primary} />
        </TouchableOpacity>
        <FloatingActionButton
          onPress={() => navigation.navigate('AddTransaction')}
          iconName="add"
          backgroundColor={colors.primary}
          style={styles.fab}
          iconSize={32}
        />

        <TransactionStatsModal
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          statsBreakdown={statsBreakdown}
          loadingStats={loadingStats}
        />
      </View>
    </DataErrorBoundary>
  );
}

const styles = StyleSheet.create({
  searchContainer: { padding: 16, paddingBottom: 8 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  smallClose: { padding: 2, marginLeft: 8 },
  statsRow: { paddingHorizontal: 16, marginBottom: 12, alignItems: 'flex-end' },
  statsPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statsLabel: { fontSize: 10, fontWeight: '800' },
  statsValue: { fontSize: 14, fontWeight: '800' },
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
  row: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  filterChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 4,
  },
  statsPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyLoader: {
    marginTop: 40,
  },
  fab: {
    bottom: Platform.OS === 'ios' ? 120 : 24,
  },
  listContent: { paddingBottom: 100 },
});
