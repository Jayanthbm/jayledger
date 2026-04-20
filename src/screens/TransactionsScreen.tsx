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
import { FlashList as ShopifyFlashList, FlashListRef } from '@shopify/flash-list';
import { FlashListItem } from '../utils/dataMappers';

const FlashList: React.ElementType = ShopifyFlashList;
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
import { useToast } from '../store/ToastContext';

import { formatCurrency } from '../utils/formatters';
import { logger } from '../utils/logger';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { showToast } = useToast();
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
    // Refresh relevant modules
    DeviceEventEmitter.emit('module_refreshed', { module: 'Dashboard' });
    DeviceEventEmitter.emit('module_refreshed', { module: 'Budgets' });

    setDeleteConfirmTx(null);
    loadData();
    showToast('Transaction deleted', 'success');
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
              </View>
              <Icon name="arrow-forward-ios" size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <FlashList
          ref={listRef}
          data={listData}
          renderItem={({ item }: { item: FlashListItem }) => {
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
              />
            );
          }}
          keyExtractor={(item: FlashListItem) =>
            item.itemType === 'header' ? `h-${item.date}` : item.id
          }
          stickyHeaderIndices={stickyHeaderIndices}
          getItemType={(item: FlashListItem) => item.itemType}
          estimatedItemSize={70}
          ListEmptyComponent={
            !loading && search.length === 0 ? (
              <FeedbackPlaceholder
                icon="receipt"
                title="No Transactions"
                subtitle="Start tracking your finances by adding your first transaction!"
                onAction={() => navigation.navigate('AddTransaction')}
                actionLabel="Add Transaction"
              />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />

        <TransactionFilterSelector
          type="Category"
          visible={showFilterModal === 'Category'}
          onClose={() => {
            setShowFilterModal(null);
            setModalSearch('');
          }}
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
          onClose={() => {
            setShowFilterModal(null);
            setModalSearch('');
          }}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filterChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  smallClose: {
    padding: 6,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    paddingBottom: 100,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  statsPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  quickFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 94,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  },
  fab: {
    bottom: Platform.OS === 'ios' ? 40 : 24,
  },
});
