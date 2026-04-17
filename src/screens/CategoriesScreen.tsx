import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Category } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { SegmentedControl } from '../components/SegmentedControl';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../store/ToastContext';

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

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation<any>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');

  const [isAddModalVisible, setAddModalVisible] = useState(false);

  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { categories: fetchedCats, viewMode: savedMode } = await fetchCategoriesData(user.id);
      setCategories(fetchedCats);
      setViewMode(savedMode);

      // We still handle the initial sync check locally for now as it involves multiple AsyncStorage checks
      // but the core data loading is via service.
    } catch (err) {
      console.error('[Categories] loadData error:', err);
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
      const updatedCats = await performCategorySync(user.id);
      setCategories(updatedCats);
      showToast('Categories synced successfully', 'success');
    } catch (e) {
      console.error('Sync error:', e);
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
            style={styles.headerTitleContainer}
          >
            <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: 'left',
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerRightBtn}
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
  }, [navigation, handleManualSync, syncing, colors.text, colors.primary, scrollToTop]);

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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerTools}>
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

        <View style={styles.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            size="medium"
            containerStyle={common.flex1}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.sortButton,
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
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
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

        <View style={styles.captionRow}>
          <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>Sorted by Name</Text>
        </View>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyCentered}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[styles.emptyHeader, { color: colors.textSecondary }]}>
            {searchQuery ? 'No Categories Found' : `No ${activeTab} Categories`}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {searchQuery ? `Nothing matches "${searchQuery}".` : 'Add your first category!'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={[styles.clearSearchBtn, { borderColor: colors.border }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.clearSearchText, { color: colors.primary }]}>Clear Search</Text>
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
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
  },
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionRow: { marginTop: 4, alignItems: 'flex-end' },
  sortCaption: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 120 },
  gridWrapper: { justifyContent: 'flex-start' },
  emptyHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  clearSearchBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 12,
  },
  clearSearchText: {
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRightBtn: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
