import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getCategories, insertCategory } from '../db/queries';
import { syncCategories, pushCategory } from '../services/syncService';
import { Category } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';

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
  
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');
  
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAppIcon, setNewAppIcon] = useState('');
  const [newTabSelection, setNewTabSelection] = useState<'Expense' | 'Income'>('Expense');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (user?.id) {
      let fetchedCats = await getCategories(user.id);
      if (fetchedCats.length === 0) {
        await syncCategories(user.id);
        fetchedCats = await getCategories(user.id);
      }
      setCategories(fetchedCats);
      try {
        const last = await AsyncStorage.getItem(`@last_sync_categories_${user.id}`);
        if (last) setLastSynced(parseInt(last, 10));
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

  const handleManualSync = async () => {
    if (!user?.id) return;
    setSyncing(true);
    await syncCategories(user.id);
    await loadData();
    setSyncing(false);
  };

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

    await pushCategory(newCategory);
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

  const getRelativeTime = (timestamp: number) => {
    const mins = Math.round((Date.now() - timestamp) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Category }) => {
    const isGrid = viewMode === 'grid';
    return (
      <TouchableOpacity 
        style={[
          styles.itemCard, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isGrid && styles.itemCardGrid
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
          {item.app_icon ? (
            <Icon name={item.app_icon as any} size={28} color={activeTab === 'Income' ? colors.success : colors.primary} />
          ) : (
             <Text style={styles.legacyIconFallback}>{item.icon || '🏷️'}</Text>
          )}
        </View>
        <Text style={[styles.itemName, { color: colors.text }, isGrid && { marginTop: 12, textAlign: 'center' }]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Toolbar */}
      <View style={styles.headerTools}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Expense' ? { backgroundColor: colors.card, borderColor: colors.border } : { borderColor: 'transparent' }]}
            onPress={() => setActiveTab('Expense')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'Expense' ? colors.text : colors.textSecondary }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Income' ? { backgroundColor: colors.card, borderColor: colors.border } : { borderColor: 'transparent' }]}
            onPress={() => setActiveTab('Income')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'Income' ? colors.text : colors.textSecondary }]}>Income</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
             <TouchableOpacity style={{ padding: 8, marginRight: -8 }} onPress={() => setSearchQuery('')}>
               <Icon name="close" size={20} color={colors.textSecondary} />
             </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          {lastSynced && (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginRight: 'auto', opacity: 0.8 }}>
              {syncing ? 'Syncing...' : `Synced ${getRelativeTime(lastSynced)}`}
            </Text>
          )}

          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSortAsc(!sortAsc)}>
            <Icon name={sortAsc ? "sort-by-alpha" : "sort"} size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 8 }]} onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}>
            <Icon name={viewMode === 'list' ? "grid-view" : "view-list"} size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 8 }]} onPress={handleManualSync} disabled={syncing}>
            {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon name="sync" size={20} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.emptyCentered}>
          <Icon name="category" size={64} color={colors.border} />
          <Text style={[styles.emptyHeader, { color: colors.textSecondary }]}>{searchQuery ? 'No Categories Found' : `No ${activeTab} Categories`}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{searchQuery ? `Nothing matches "${searchQuery}".` : 'Add your first category!'}</Text>
          {searchQuery && (
            <TouchableOpacity style={{ padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 20 }} onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
         <FlatList
            key={viewMode}
            data={filteredData}
            numColumns={viewMode === 'grid' ? 2 : 1}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
         />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setAddModalVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>New Category</Text>
            
            <View style={[styles.tabContainer, { marginBottom: 20 }]}>
              <TouchableOpacity style={[styles.tabButton, newTabSelection === 'Expense' ? { backgroundColor: colors.background, borderColor: colors.border } : { borderColor: 'transparent' }]} onPress={() => setNewTabSelection('Expense')}>
                <Text style={[styles.tabText, { color: newTabSelection === 'Expense' ? colors.text : colors.textSecondary }]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, newTabSelection === 'Income' ? { backgroundColor: colors.background, borderColor: colors.border } : { borderColor: 'transparent' }]} onPress={() => setNewTabSelection('Income')}>
                <Text style={[styles.tabText, { color: newTabSelection === 'Income' ? colors.text : colors.textSecondary }]}>Income</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name</Text>
            <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="e.g. Groceries" placeholderTextColor={colors.textSecondary} value={newName} onChangeText={setNewName} />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Material Icon Name (Optional)</Text>
            <TextInput style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="e.g. fastfood, flight" placeholderTextColor={colors.textSecondary} value={newAppIcon} onChangeText={setNewAppIcon} autoCapitalize="none" />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!newName.trim() || isSaving) ? 0.5 : 1 }]} onPress={handleAddCategory} disabled={!newName.trim() || isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Category</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 60 },
  
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: 'transparent', padding: 4, borderRadius: 12, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  tabText: { fontWeight: '600', fontSize: 14 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 100 },
  gridWrapper: { justifyContent: 'space-between' },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  itemCardGrid: { flex: 0.48, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 16 },
  legacyIconFallback: { fontSize: 28 },
  itemName: { fontSize: 16, fontWeight: '600', flex: 1 },

  emptyHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },

  fab: { position: 'absolute', right: 24, bottom: 110, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  
  saveButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
