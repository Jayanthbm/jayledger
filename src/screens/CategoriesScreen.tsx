import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Category } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SegmentedControl } from '../components/SegmentedControl';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../store/ToastContext';
import { getRelativeTime } from '../utils/dateUtils';

import {
  fetchCategoriesData,
  saveCategoryViewMode,
  addCategory,
  performCategorySync,
} from '../services/categoryService';

// Modular Components
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryAddModal } from '../components/categories/CategoryAddModal';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { common } from '../styles/common';
import { AppNavigation } from '../navigation/navigationTypes';
import { logger } from '../utils/logger';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation<AppNavigation>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');

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

  const filteredData = useMemo(() => {
    let result = categories.filter((c) => c.type === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [categories, searchQuery, sortAsc, activeTab]);

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
            <TouchableOpacity
              style={[
                common.sortButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSortAsc(!sortAsc)}
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
          </View>
        </View>

        <View style={common.captionRow}>
          <Text style={[common.sortCaption, { color: colors.textSecondary }]}>Sorted by Name</Text>
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
          key={viewMode}
          data={filteredData}
          numColumns={viewMode === 'grid' ? 3 : 1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              viewMode={viewMode}
              colors={colors}
              onPress={(cat) =>
                navigation.navigate('Main', {
                  screen: 'Transactions',
                  params: { initialSelectedCats: [cat.id] },
                })
              }
            />
          )}
          contentContainerStyle={common.listContent16T4B120}
          columnWrapperStyle={viewMode === 'grid' ? common.justifyStart : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingActionButton
        onPress={() => setAddModalVisible(true)}
        iconName="add"
        backgroundColor={colors.primary}
      />

      <CategoryAddModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCategorySubmit}
        colors={colors}
      />
    </View>
  );
}
