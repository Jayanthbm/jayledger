import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { Category } from '@/models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useNavigation } from 'expo-router';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/store/ToastContext';
import { getRelativeTime } from '@/utils/dateUtils';

import {
  fetchCategoriesData,
  saveCategoryViewMode,
  addCategory,
  performCategorySync,
  backgroundPushCategories,
  filterAndSortCategories,
} from '@/services/categoryService';
import { updateCategoryPriorities } from '@/db/queries';

// Modular Components
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryAddModal } from '@/components/categories/CategoryAddModal';
import { CategorySortModal } from '@/components/categories/CategorySortModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { common } from '@/styles/common';
import { logger } from '@/utils/logger';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'priority'>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');
  const [isReordering, setIsReordering] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const {
        categories: fetchedCats,
        viewMode: savedMode,
        lastSynced: synced,
      } = await fetchCategoriesData(user.id);
      setCategories(fetchedCats);
      setViewMode(savedMode);
      setLastSynced(synced);

      // We still handle the initial sync check locally for now as it involves multiple AsyncStorage checks
      // but the core data loading is via service.
    } catch (err) {
      logger.error('[Categories] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      await saveCategoryViewMode(user.id, newMode);
    }
  };

  const toggleReorderMode = () => {
    // If exiting reorder mode, sync the changes
    if (isReordering && user?.id) {
      backgroundPushCategories(user.id);
    }
    setIsReordering(!isReordering);
    if (!isReordering) setViewMode('list'); // Force list for reordering
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newData = [...filteredData];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newData.length) return;

    [newData[index], newData[targetIndex]] = [newData[targetIndex], newData[index]];

    const updatedItems = newData.map((item, i) => ({ ...item, priority: i + 1 }));
    const updates = updatedItems.map((item) => ({ id: item.id, priority: item.priority }));

    setCategories((prev) => {
      const remaining = prev.filter((p) => !updatedItems.find((n) => n.id === p.id));
      const merged = [...remaining, ...updatedItems];
      return merged.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    });

    try {
      if (user?.id) {
        await updateCategoryPriorities(updates, user.id);
        // Don't sync here - will sync when user clicks Done
      }
    } catch (error) {
      logger.error('Reorder Error:', error);
      loadData();
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      const { categories: updatedCats, lastSynced: synced } = await performCategorySync(user.id);
      setCategories(updatedCats);
      setLastSynced(synced);
      showToast('Categories synced successfully', 'success');
    } catch (e) {
      logger.error('Sync error:', e);
    } finally {
      setSyncing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.setOptions({
        headerTitle: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={scrollToTop}
            style={common.headerTitleContainer}
          >
            <Text style={[common.navHeaderTitle, { color: colors.text }]}>Categories</Text>
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
              <MaterialIcons name="refresh" size={24} color={colors.text} />
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

  const handleAddCategorySubmit = async (
    name: string,
    type: 'Expense' | 'Income',
    appIcon: string,
  ) => {
    if (!user?.id) return;
    const newCat = await addCategory(user.id, name, type, appIcon);
    setCategories((prev) => [...prev, newCat]);
    showToast('Category added successfully', 'success');
  };

  const filteredData = filterAndSortCategories(
    categories,
    activeTab,
    searchQuery,
    sortBy,
    sortAsc,
    isReordering,
  );

  if (loading) {
    return (
      <View style={[common.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[common.flex1, { backgroundColor: colors.background }]}>
      <View style={common.headerTools}>
        <SegmentedControl
          options={[
            { label: 'Expense', value: 'Expense', activeColor: colors.danger },
            { label: 'Income', value: 'Income', activeColor: colors.success },
          ]}
          selectedValue={activeTab}
          onValueChange={(val: 'Expense' | 'Income') => setActiveTab(val)}
          variant="medium"
          containerStyle={common.mb16}
        />

        <View style={common.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            size="medium"
            containerStyle={common.flex1}
          />
          <View style={common.actionRow}>
            {!isReordering && (
              <TouchableOpacity
                style={[
                  common.sortButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setShowSortModal(true)}
              >
                <View style={common.flexRowCenterGap4}>
                  <MaterialIcons name="sort" size={18} color={colors.primary} />
                  <MaterialIcons
                    name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                    size={14}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            )}
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
                <MaterialIcons
                  name={isReordering ? 'check' : 'reorder'}
                  size={18}
                  color={colors.primary}
                />
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
                <MaterialIcons
                  name={viewMode === 'list' ? 'grid-view' : 'view-list'}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={common.captionRow}>
          <Text style={[common.sortCaption, { color: colors.textSecondary }]}>
            Sorted by {sortBy === 'priority' ? 'Priority' : 'Name'}
          </Text>
        </View>
      </View>

      {searchQuery.length > 0 && filteredData.length === 0 && (
        <View style={common.ph16}>
          <View
            style={[
              common.noResultsSearchContainer,
              { borderColor: colors.border, backgroundColor: colors.card + '50' },
            ]}
          >
            <Text style={[common.noResultsSearchText, { color: colors.textSecondary }]}>
              No categories found matching &quot;{searchQuery}&quot;
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={[common.clearSearchButton, { backgroundColor: colors.primary + '15' }]}
            >
              <Text style={[common.clearSearchText, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {filteredData.length === 0 ? (
        <View style={common.emptyCenterPadded}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[common.emptyTitle20Bold, { color: colors.textSecondary }]}>
            {searchQuery ? 'No Categories Found' : `No ${activeTab} Categories`}
          </Text>
          <Text style={[common.emptySub14Centered, { color: colors.textSecondary }]}>
            {searchQuery ? `Nothing matches "${searchQuery}".` : 'Add your first category!'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={[common.clearOutlineButton, { borderColor: colors.border }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[common.textBold600, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key={`${viewMode}-${isReordering}`}
          data={filteredData}
          numColumns={viewMode === 'grid' && !isReordering ? 3 : 1}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if (isReordering) {
              return (
                <View style={[styles.reorderRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.reorderContent}>
                    <CategoryCard item={item} viewMode="list" colors={colors} onPress={() => {}} />
                  </View>
                  <View style={styles.reorderArrows}>
                    <TouchableOpacity
                      onPress={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      style={index === 0 ? styles.arrowBtnDisabled : styles.arrowBtn}
                    >
                      <MaterialIcons name="expand-less" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveItem(index, 'down')}
                      disabled={index === filteredData.length - 1}
                      style={
                        index === filteredData.length - 1
                          ? styles.arrowBtnDisabled
                          : styles.arrowBtn
                      }
                    >
                      <MaterialIcons name="expand-more" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            return (
              <CategoryCard
                item={item}
                viewMode={viewMode}
                colors={colors}
                onPress={(cat) =>
                  router.push({
                    pathname: '/(tabs)/transactions',
                    params: { initialSelectedCats: [cat.id] },
                  })
                }
              />
            );
          }}
          contentContainerStyle={common.listContent16T4B120}
          columnWrapperStyle={
            viewMode === 'grid' && !isReordering ? common.justifyStart : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {!isReordering && (
        <FloatingActionButton
          onPress={() => setAddModalVisible(true)}
          iconName="add"
          backgroundColor={colors.primary}
        />
      )}

      <CategoryAddModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCategorySubmit}
        colors={colors}
      />

      <CategorySortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={(mode, asc) => {
          setSortBy(mode);
          setSortAsc(asc);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disabledOpacity: {
    opacity: 0.5,
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  reorderContent: {
    flex: 1,
  },
  reorderArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 4,
  },
  arrowBtnDisabled: {
    padding: 4,
    opacity: 0.3,
  },
});
