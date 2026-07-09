import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { Transaction, QuickTransaction, ThemeColors, MaterialIconName } from '@/models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { TransactionCard } from '@/components/TransactionCard';
import { SearchBar } from '@/components/SearchBar';
import { deleteTransactionAsync, getQuickTransactions } from '@/db/queries';
import { FlashList as ShopifyFlashList, FlashListRef } from '@shopify/flash-list';
import { FlashListItem } from '@/utils/dataMappers';

const FlashList: React.ElementType = ShopifyFlashList;
import { TransactionFilterSelector } from '@/components/transactions/TransactionFilterSelector';
import { TransactionDateFilterModal } from '@/components/transactions/TransactionDateFilterModal';
import { TransactionDeleteModal } from '@/components/transactions/TransactionDeleteModal';
import { TransactionQuickModal } from '@/components/transactions/TransactionQuickModal';
import { TransactionStatsModal } from '@/components/transactions/TransactionStatsModal';
import { TransactionSectionHeader } from '@/components/transactions/TransactionSectionHeader';
import { syncTransactions } from '@/services/syncService';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { common } from '@/styles/common';
import { DataErrorBoundary } from '@/components/common/ErrorBoundaries';
import { SyncFeedback } from '@/components/common/SyncFeedback';
import { FeedbackPlaceholder } from '@/components/common/FeedbackPlaceholder';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { useTransactionSync } from '@/hooks/useTransactionSync';
import { useToast } from '@/store/ToastContext';

import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/utils/logger';

interface FilterIconButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  count?: number;
  onPress: () => void;
  colors: ThemeColors;
}

const FilterIconButton = React.memo(
  ({ icon, label, isActive, count = 0, onPress, colors }: FilterIconButtonProps) => {
    return (
      <TouchableOpacity style={styles.filterItem} onPress={onPress} activeOpacity={0.7}>
        <View
          style={[
            styles.filterIconContainer,
            {
              backgroundColor: isActive ? colors.primary + '15' : colors.background,
              borderColor: isActive ? colors.primary : colors.border,
            },
          ]}
        >
          <Icon
            name={icon as MaterialIconName}
            size={20}
            color={isActive ? colors.primary : colors.textSecondary}
          />
          {isActive && count > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.card,
                },
              ]}
            >
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.filterItemLabel,
            { color: isActive ? colors.primary : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  },
);
FilterIconButton.displayName = 'FilterIconButton';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<any>();

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
    selectedGroups,
    setSelectedGroups,
    tempSelectedCats,
    setTempSelectedCats,
    tempSelectedPayees,
    setTempSelectedPayees,
    tempSelectedGroups,
    setTempSelectedGroups,
    categories,
    payees,
    groups,
    showFilterModal,
    setShowFilterModal,
    modalSearch,
    setModalSearch,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadFilterData,
    loadData,
    loadStatsBreakdown,
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

    const quickActionSub = DeviceEventEmitter.addListener('show_quick_transaction_modal', () => {
      logger.info('[TransactionsScreen] Quick transaction modal triggered via quick action');
      setShowQuickModal(true);
    });

    return () => {
      sub.remove();
      quickActionSub.remove();
    };
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
    router.push({
      pathname: '/add-transaction',
      params: { transaction: JSON.stringify(tx) },
    });
  };

  // Auto-scroll to top when data updates due to filter changes
  useEffect(() => {
    if (listData.length > 0) {
      const timer = setTimeout(() => {
        scrollToTop();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    search,
    selectedCats,
    selectedPayees,
    selectedGroups,
    startDate,
    endDate,
    scrollToTop,
    listData.length,
  ]);

  const hasAnyFilter =
    !!startDate ||
    !!endDate ||
    selectedCats.length > 0 ||
    selectedPayees.length > 0 ||
    selectedGroups.length > 0;

  const getFilterSummaryText = () => {
    const parts: string[] = [];
    if (startDate || endDate) {
      try {
        if (startDate && endDate) {
          parts.push(
            `${format(parseISO(startDate), 'dd MMM')} - ${format(parseISO(endDate), 'dd MMM')}`,
          );
        } else if (startDate) {
          parts.push(`From ${format(parseISO(startDate), 'dd MMM')}`);
        } else if (endDate) {
          parts.push(`To ${format(parseISO(endDate), 'dd MMM')}`);
        }
      } catch {
        parts.push('Custom Dates');
      }
    }
    if (selectedCats.length > 0) {
      parts.push(`${selectedCats.length} Cat${selectedCats.length > 1 ? 's' : ''}`);
    }
    if (selectedPayees.length > 0) {
      parts.push(`${selectedPayees.length} Payee${selectedPayees.length > 1 ? 's' : ''}`);
    }
    if (selectedGroups.length > 0) {
      parts.push(`${selectedGroups.length} Group${selectedGroups.length > 1 ? 's' : ''}`);
    }
    return parts.join(' • ');
  };

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

        {listData.length > 0 && hasAnyFilter && (
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

        {/* Modern unified 4-icon filter toolbar */}
        <View
          style={[
            styles.filterToolbar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FilterIconButton
            icon="calendar-today"
            label="Date"
            isActive={!!startDate || !!endDate}
            count={startDate || endDate ? 1 : 0}
            onPress={() => setShowFilterModal('Calendar')}
            colors={colors}
          />
          <FilterIconButton
            icon="category"
            label="Category"
            isActive={selectedCats.length > 0}
            count={selectedCats.length}
            onPress={() => setShowFilterModal('Category')}
            colors={colors}
          />
          <FilterIconButton
            icon="person"
            label="Payee"
            isActive={selectedPayees.length > 0}
            count={selectedPayees.length}
            onPress={() => setShowFilterModal('Payee')}
            colors={colors}
          />
          <FilterIconButton
            icon="folder"
            label="Groups"
            isActive={selectedGroups.length > 0}
            count={selectedGroups.length}
            onPress={() => setShowFilterModal('Group')}
            colors={colors}
          />
        </View>

        {/* Active Filters Summary */}
        {hasAnyFilter && (
          <View style={styles.activeFiltersSummaryRow}>
            <Text
              style={[styles.activeFiltersText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {getFilterSummaryText()}
            </Text>
            <TouchableOpacity
              onPress={clearFilters}
              style={[styles.clearFiltersButton, { backgroundColor: colors.primary + '15' }]}
            >
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {search.length > 0 && listData.length === 0 && (
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
                transaction={item as Transaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onFilterPayee={(id) => id && setSelectedPayees([id])}
                onFilterCategory={(id) => id && setSelectedCats([id])}
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
            !loading ? (
              search.length === 0 ? (
                <FeedbackPlaceholder
                  icon="receipt"
                  title="No Transactions"
                  subtitle="Start tracking your finances by adding your first transaction!"
                  onAction={() => router.push('/add-transaction')}
                  actionLabel="Add Transaction"
                />
              ) : (
                <View style={common.emptyCenterPadded}>
                  <Icon name="search-off" size={64} color={colors.border} />
                  <Text style={[common.emptyTitle20Bold, { color: colors.textSecondary }]}>
                    No Results Found
                  </Text>
                  <Text style={[common.emptySub14Centered, { color: colors.textSecondary }]}>
                    Try adjusting your filters or search query.
                  </Text>
                </View>
              )
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
        <TransactionFilterSelector
          type="Group"
          visible={showFilterModal === 'Group'}
          onClose={() => {
            setShowFilterModal(null);
            setModalSearch('');
          }}
          categories={categories}
          payees={payees}
          groups={groups}
          tempSelectedItems={tempSelectedGroups}
          setTempSelectedItems={setTempSelectedGroups}
          onApply={(selected) => {
            setSelectedGroups(selected);
            setShowFilterModal(null);
            setModalSearch('');
          }}
          colors={colors}
          modalSearch={modalSearch}
          setModalSearch={setModalSearch}
        />
        <TransactionDateFilterModal
          visible={showFilterModal === 'Calendar'}
          onClose={() => setShowFilterModal(null)}
          startDate={startDate}
          endDate={endDate}
          onApply={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setShowFilterModal(null);
          }}
          colors={colors}
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
            router.push({
              pathname: '/add-transaction',
              params: { quickTransaction: JSON.stringify(item) },
            });
          }}
        />

        <TouchableOpacity
          style={[styles.quickFab, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowQuickModal(true)}
        >
          <Icon name="bolt" size={28} color={colors.primary} />
        </TouchableOpacity>
        <FloatingActionButton
          onPress={() => router.push('/add-transaction')}
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
  filterToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  filterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  filterItemLabel: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  activeFiltersSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  activeFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  clearFiltersButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'flex-end',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  statsPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  quickFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 94,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 64 / 3,
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
