import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { deleteQuickTransaction, updateQuickTransactionPriorities } from '@/db/queries';
import { QuickTransaction } from '@/models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { common } from '@/styles/common';
import { logger } from '@/utils/logger';
import { QuickTransactionCard } from '@/components/transactions/QuickTransactionCard';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/store/ToastContext';
import { getRelativeTime } from '@/utils/dateUtils';
import {
  fetchQuickTransactionsData,
  saveQuickTransactionViewMode,
  performQuickTransactionSync,
  backgroundPushQuickTransactions,
} from '@/services/quickTransactionService';

export default function QuickTransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const dynamicStyles = React.useMemo(
    () => ({
      listContent: { paddingBottom: insets.bottom + 80, paddingHorizontal: 10, paddingTop: 4 },
      fab: { bottom: insets.bottom + 16 },
    }),
    [insets.bottom],
  );

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const [data, setData] = useState<QuickTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [isReordering, setIsReordering] = useState(false);
  const [viewMode, setViewMode] = useState<'Card' | 'List'>('Card');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const {
        quickTransactions,
        viewMode: savedViewMode,
        lastSynced: synced,
      } = await fetchQuickTransactionsData(session.user.id);
      setData(quickTransactions);
      setViewMode(savedViewMode);
      setLastSynced(synced);
    } catch (error) {
      logger.error('Load Quick Transactions Error:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const toggleReorderMode = () => {
    // If exiting reorder mode, sync the changes
    if (isReordering && session?.user?.id) {
      backgroundPushQuickTransactions(session.user.id);
    }
    setIsReordering(!isReordering);
    if (!isReordering) setViewMode('List'); // Force list for reordering
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === 'Card' ? 'List' : 'Card';
    setViewMode(newMode);
    if (session?.user?.id) {
      await saveQuickTransactionViewMode(session.user.id, newMode);
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!session?.user?.id) return;
    setSyncing(true);
    try {
      const { quickTransactions, lastSynced: synced } = await performQuickTransactionSync(
        session.user.id,
      );
      setData(quickTransactions);
      setLastSynced(synced);
      showToast('Quick transactions synced', 'success');
    } catch (e) {
      logger.error('Quick transaction sync error:', e);
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }, [session, showToast]);

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newData = [...filteredData]; // Use current visible list
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newData.length) return;

    // Swap items
    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];

    // Update priorities based on new indices
    const updatedItems = newData.map((item, i) => ({ ...item, priority: i + 1 }));
    const updates = updatedItems.map((item) => ({ id: item.id, priority: item.priority }));

    // Optimistic update
    setData((prev) => {
      const remaining = prev.filter((p) => !updatedItems.find((n) => n.id === p.id));
      const merged = [...remaining, ...updatedItems];
      return merged.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    });

    try {
      if (session?.user?.id) {
        await updateQuickTransactionPriorities(updates, session.user.id);
        // Don't sync here - will sync when user clicks Done
      }
    } catch (error) {
      logger.error('Reorder Error:', error);
      loadData(); // Rollback
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={scrollToTop}
            style={common.headerTitleContainer}
          >
            <Text style={[common.navHeaderTitle, { color: colors.text }]}>Quick Transactions</Text>
            {lastSynced && (
              <Text style={[common.navHeaderSubtitle, { color: colors.textSecondary }]}>
                Synced: {getRelativeTime(lastSynced)}
              </Text>
            )}
          </TouchableOpacity>
        ),
        headerTitleAlign: 'left',
        headerRight: () => (
          <TouchableOpacity
            style={common.headerRightBtn}
            onPress={handleManualSync}
            disabled={syncing}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="refresh" size={24} color={colors.text} />
            )}
          </TouchableOpacity>
        ),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [
    navigation,
    handleManualSync,
    syncing,
    colors.text,
    colors.textSecondary,
    colors.primary,
    scrollToTop,
    lastSynced,
  ]);

  const q = searchQuery.trim().toLowerCase();
  const filteredData = (
    q ? data.filter((item) => item.name.toLowerCase().includes(q)) : [...data]
  ).sort((a, b) => (a.priority || 0) - (b.priority || 0));

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadData();
      }, 0);
      return () => clearTimeout(timer);
    }, [loadData]),
  );

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!session?.user?.id || !deletingId) return;
    await deleteQuickTransaction(deletingId, session.user.id);
    setDeletingId(null);
    loadData();
  };

  const handleEdit = (item: QuickTransaction) => {
    if (isReordering) return;
    router.push({
      pathname: '/add-quick-transaction',
      params: { quickTransaction: JSON.stringify(item) },
    });
  };

  const renderItem = ({ item, index }: { item: QuickTransaction; index: number }) => {
    if (viewMode === 'Card' && !isReordering) {
      return (
        <QuickTransactionCard item={item} onPress={handleEdit} showDelete onDelete={handleDelete} />
      );
    }

    // List View or Reorder Mode
    return (
      <View style={[styles.listRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.listItemContent}
          onPress={() => handleEdit(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor:
                  item.type === 'Income' ? colors.success + '15' : colors.danger + '15',
              },
            ]}
          >
            <Icon
              name={item.type === 'Income' ? 'add' : 'remove'}
              size={20}
              color={item.type === 'Income' ? colors.success : colors.danger}
            />
          </View>
          <View style={common.flex1}>
            <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
              {item.type} Template
            </Text>
          </View>
          {item.amount && (
            <Text
              style={[
                styles.listAmount,
                { color: item.type === 'Income' ? colors.success : colors.danger },
              ]}
            >
              ₹{item.amount}
            </Text>
          )}
        </TouchableOpacity>

        {isReordering ? (
          <View style={styles.reorderArrows}>
            <TouchableOpacity
              onPress={() => moveItem(index, 'up')}
              disabled={index === 0}
              style={[styles.arrowBtn, index === 0 && styles.disabledBtn]}
            >
              <Icon name="expand-less" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveItem(index, 'down')}
              disabled={index === data.length - 1}
              style={[styles.arrowBtn, index === data.length - 1 && styles.disabledBtn]}
            >
              <Icon name="expand-more" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.listDelete}>
            <Icon name="delete-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <View style={common.headerTools}>
        <View style={common.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search templates..."
            size="medium"
            containerStyle={common.flex1}
          />
          <View style={common.actionRow}>
            <TouchableOpacity
              style={[
                common.sortButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                searchQuery.length > 0 && styles.disabledOpacity,
              ]}
              onPress={searchQuery.length > 0 ? undefined : toggleReorderMode}
              disabled={searchQuery.length > 0}
            >
              <View style={common.flexRowCenterGap4}>
                <Icon name={isReordering ? 'check' : 'sort'} size={18} color={colors.primary} />
                <Text style={styles.orderBtnText}>{isReordering ? 'Done' : 'Order'}</Text>
              </View>
            </TouchableOpacity>
            {!isReordering && (
              <TouchableOpacity
                style={[
                  common.iconButton44,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={toggleViewMode}
              >
                <Icon
                  name={viewMode === 'Card' ? 'view-list' : 'grid-view'}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={filteredData}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'Card' && !isReordering ? 2 : 1}
        key={`${viewMode}-${isReordering}`}
        renderItem={renderItem}
        contentContainerStyle={[dynamicStyles.listContent]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bolt" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {searchQuery ? 'No Templates Found' : 'No Templates Yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {searchQuery
                ? `Nothing matches "${searchQuery}".`
                : 'Create templates for transactions you do frequently to add them in one tap.'}
            </Text>
          </View>
        }
      />
      {!isReordering && (
        <FloatingActionButton
          onPress={() => router.push('/add-quick-transaction')}
          iconName="add"
          backgroundColor={colors.primary}
          style={dynamicStyles.fab}
          iconSize={30}
        />
      )}

      <BottomSheet
        visible={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Template?"
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <View style={[styles.deleteIconBox, { backgroundColor: colors.danger + '15' }]}>
              <Icon name="delete-outline" size={32} color={colors.danger} />
            </View>
            <Text style={[styles.sheetText, { color: colors.textSecondary }]}>
              Are you sure you want to delete this template? This action cannot be undone.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]}
            onPress={confirmDelete}
          >
            <Text style={styles.confirmDeleteText}>Delete Template</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySub: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  sheetInner: {
    paddingBottom: 10,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  confirmDeleteBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF', // Fallback blue, will be overridden or used if primary matches
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '700',
  },
  listMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  listAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
  },
  listDelete: {
    padding: 8,
  },
  reorderArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 4,
  },
  disabledBtn: {
    opacity: 0.3,
  },
});
