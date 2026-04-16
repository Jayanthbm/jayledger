import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getCategories, insertCategory } from '../db/queries';
import { syncCategories } from '../services/syncService';
import { Category } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { getRelativeTime } from '../utils/dateUtils';
import { BottomSheet } from '../components/BottomSheet';
import { SegmentedControl } from '../components/SegmentedControl';

const generateUUID = () => {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random()*16)%16 | 0;
    dt = Math.floor(dt/16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');

  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('');
  const [newTabSelection, setNewTabSelection] = useState<'Expense' | 'Income'>('Expense');
  const [isSaving, setIsSaving] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Load viewMode preference
      try {
        const savedMode = await AsyncStorage.getItem(`@category_view_mode_${user.id}`);
        if (savedMode === 'list' || savedMode === 'grid') {
          setViewMode(savedMode as 'list' | 'grid');
        }
      } catch (e) {}

      let fetchedCats = await getCategories(user.id);
      setCategories(fetchedCats);

      const last = await AsyncStorage.getItem(`@last_sync_categories_${user.id}`);
      if (last) {
        setLastSyncTime(getRelativeTime(parseInt(last)));
      }

      if (fetchedCats.length === 0) {
        const alreadyChecked = await AsyncStorage.getItem(`@initial_categories_sync_checked_${user.id}`);
        if (!alreadyChecked) {
          setSyncing(true);
          await syncCategories(user.id);
          await AsyncStorage.setItem(`@initial_categories_sync_checked_${user.id}`, 'true');
          const lastUpdated = await AsyncStorage.getItem(`@last_sync_categories_${user.id}`);
          if (lastUpdated) {
            setLastSyncTime(getRelativeTime(parseInt(lastUpdated)));
          }
          fetchedCats = await getCategories(user.id);
          setCategories(fetchedCats);
          setSyncing(false);
        }
      }
    } catch (err) {
      console.error("[Categories] loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`@category_view_mode_${user.id}`, newMode);
      } catch (e) {}
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error("[Categories] Load error:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const navigation = useNavigation<any>();

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setSyncing(true);
    await syncCategories(user.id);
    const last = await AsyncStorage.getItem(`@last_sync_categories_${user.id}`);
    if (last) {
      setLastSyncTime(getRelativeTime(parseInt(last)));
    }
    await loadData();
    setSyncing(false);
  }, [user?.id, loadData]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={scrollToTop}
          style={{ alignItems: 'flex-start' }}
        >
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Categories</Text>
          {lastSyncTime ? (
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Synced: {lastSyncTime}</Text>
          ) : null}
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left',
      headerRight: () => (
        <TouchableOpacity
          style={{ paddingRight: 16, justifyContent: 'center', alignItems: 'center' }}
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
      )
    });
  }, [navigation, handleManualSync, syncing, colors.text, colors.textSecondary, colors.primary, lastSyncTime]);

  const handleAddCategory = async () => {
    if (!newName.trim() || !user?.id) return;
    Keyboard.dismiss();
    setIsSaving(true);

    const newCategory: Category = {
      id: generateUUID(),
      name: newName.trim(),
      type: newTabSelection,
      icon: '', // legacy
      app_icon: newAppIcon.trim() || 'category',
      user_id: user.id
    };

    await insertCategory(newCategory);
    setCategories(prev => [...prev, newCategory]);

    setAddModalVisible(false);
    setNewName('');
    setNewAppIcon('');
    setIsSaving(false);

    syncCategories(user.id).catch(err => console.error("Category sync failed", err));
  };

  const filteredData = useMemo(() => {
    let result = categories.filter(c => c.type === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
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

  const renderItem = ({ item }: { item: Category }) => {
    const isGrid = viewMode === 'grid';
    const accentColor = item.type === 'Income' ? colors.success : colors.primary;

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isGrid && styles.itemCardGrid
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Main', {
          screen: 'Transactions',
          params: { initialSelectedCats: [item.id] }
        })}
      >
        <View style={[
          styles.iconBox,
          { backgroundColor: accentColor + '15' }, // 15% opacity tint
          isGrid && { marginRight: 0 }
        ]}>
          {item.app_icon ? (
            <MaterialIcons name={item.app_icon as any} size={isGrid ? 24 : 26} color={accentColor} />
          ) : (
             <Text style={[styles.legacyIconFallback, { fontSize: isGrid ? 22 : 24 }]}>{item.icon || '🏷️'}</Text>
          )}
        </View>
        <Text style={[
          styles.itemName,
          { color: colors.text },
          isGrid && { marginTop: 10, textAlign: 'center', fontSize: 13 }
        ]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header Toolbar */}
      <View style={styles.headerTools}>
        <SegmentedControl
          options={[
            { label: 'Expense', value: 'Expense', activeColor: colors.danger },
            { label: 'Income', value: 'Income', activeColor: colors.success }
          ]}
          selectedValue={activeTab}
          onValueChange={(val: 'Expense' | 'Income') => setActiveTab(val)}
          variant="medium"
          containerStyle={{ marginBottom: 16 }}
        />

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
             <TouchableOpacity style={{ padding: 8, marginRight: -8 }} onPress={() => setSearchQuery('')}>
               <MaterialIcons name="close" size={20} color={colors.textSecondary} />
             </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSortAsc(!sortAsc)}>
            <MaterialIcons name={sortAsc ? "sort-by-alpha" : "sort"} size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 8 }]} onPress={toggleViewMode}>
            <MaterialIcons name={viewMode === 'list' ? "grid-view" : "view-list"} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyCentered}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[styles.emptyHeader, { color: colors.textSecondary }]}>{searchQuery ? 'No Categories Found' : `No ${activeTab} Categories`}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{searchQuery ? `Nothing matches "${searchQuery}".` : 'Add your first category!'}</Text>
          {searchQuery && (
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginTop: 12 }} onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
          <FlatList
            ref={listRef}
            key={viewMode}
            data={filteredData}
            numColumns={viewMode === 'grid' ? 3 : 1}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
            showsVerticalScrollIndicator={false}
          />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <BottomSheet
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        title="New Category"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SegmentedControl
            options={[
              { label: 'Expense', value: 'Expense', activeColor: colors.danger },
              { label: 'Income', value: 'Income', activeColor: colors.success }
            ]}
            selectedValue={newTabSelection}
            onValueChange={(val: 'Expense' | 'Income') => setNewTabSelection(val)}
            variant="small"
            containerStyle={{ marginBottom: 20 }}
          />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
            <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Groceries" placeholderTextColor={colors.textSecondary} value={newName} onChangeText={setNewName} />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Material Icon Name (Optional)</Text>
            <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="e.g. fastfood, flight" placeholderTextColor={colors.textSecondary} value={newAppIcon} onChangeText={setNewAppIcon} autoCapitalize="none" />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!newName.trim() || isSaving) ? 0.5 : 1 }]} onPress={handleAddCategory} disabled={!newName.trim() || isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Category</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </BottomSheet>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 60 },

  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },

  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 16, paddingTop: 4, paddingBottom: 120 }, // Extra space for FAB and bottom tabs
  gridWrapper: { justifyContent: 'flex-start' }, // Left align for more grid stability

  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  itemCardGrid: { width: '31%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 8, marginHorizontal: '1%' },

  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12 },
  legacyIconFallback: { fontSize: 24 },
  itemName: { fontSize: 13, fontWeight: '700', flex: 1 },

  emptyHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },

  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },


  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },

  saveButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
