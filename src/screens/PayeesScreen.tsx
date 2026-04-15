import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, FlatList, Modal, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getPayees, insertPayee } from '../db/queries';
import { runFullSync } from '../services/syncService';
import { Payee } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

// Lightweight UUIDv4 generator for offline creation
const generateUUID = () => {
  let dt = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random()*16)%16 | 0;
    dt = Math.floor(dt/16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

export default function PayeesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Add Modal State
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newPayeeName, setNewPayeeName] = useState('');
  const [newPayeeLogo, setNewPayeeLogo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (user?.id) {
      // Load viewMode preference
      try {
        const savedMode = await AsyncStorage.getItem(`@payee_view_mode_${user.id}`);
        if (savedMode === 'list' || savedMode === 'grid') {
          setViewMode(savedMode);
        }
      } catch (e) {}

      let fetchedPayees = await getPayees(user.id);
      if (fetchedPayees.length === 0) {
        await runFullSync(user.id);
        fetchedPayees = await getPayees(user.id);
      }
      setPayees(fetchedPayees);
      try {
        const last = await AsyncStorage.getItem(`@last_sync_payees_${user.id}`);
        if (last) setLastSynced(parseInt(last, 10));
      } catch (e) {}
    }
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`@payee_view_mode_${user.id}`, newMode);
      } catch (e) {}
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error("[Payees] Load error:", error);
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
    await runFullSync(user.id, true);
    await loadData();
    setSyncing(false);
  }, [user?.id, loadData]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Payees',
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
  }, [navigation, handleManualSync, syncing, colors.text, colors.primary]);

  const handleAddPayee = async () => {
    if (!newPayeeName.trim() || !user?.id) return;
    Keyboard.dismiss();
    setIsSaving(true);
    
    const newPayee: Payee = {
      id: generateUUID(),
      name: newPayeeName.trim(),
      logo: newPayeeLogo.trim() || '',
      user_id: user.id
    };

    // Optimistic Local Insert
    await insertPayee(newPayee);
    setPayees(prev => [...prev, newPayee]);
    
    setAddModalVisible(false);
    setNewPayeeName('');
    setNewPayeeLogo('');
    setIsSaving(false);

    // Background push sync
    runFullSync(user.id).catch(err => console.error("Payee sync failed", err));
  };

  // Memoized processing for search & sort
  const filteredPayees = useMemo(() => {
    let result = [...payees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [payees, searchQuery, sortAsc]);


  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Payee }) => {
    const isGrid = viewMode === 'grid';
    
    return (
      <TouchableOpacity 
        style={[
          styles.payeeCard, 
          { backgroundColor: colors.card, borderColor: colors.border },
          isGrid && styles.payeeCardGrid
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Main', { 
          screen: 'Transactions', 
          params: { initialSelectedPayees: [item.id] } 
        })}
      >
        <View style={[
          styles.logoContainer, 
          { backgroundColor: colors.primary + '15' }, // 15% opacity tint
          isGrid && { marginRight: 0 }
        ]}>
          {item.logo && item.logo.startsWith('http') ? (
            <Image source={{ uri: item.logo }} style={styles.logoImage} />
          ) : (
            <Text style={[styles.logoFallback, { color: colors.primary, fontSize: isGrid ? 18 : 22 }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={[
          styles.payeeName, 
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
      
      {/* Header Tools */}
      <View style={styles.headerTools}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search payees..."
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
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => setSortAsc(!sortAsc)}
          >
            <MaterialIcons name={sortAsc ? "sort-by-alpha" : "sort"} size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: 8 }]} 
            onPress={toggleViewMode}
          >
            <MaterialIcons name={viewMode === 'list' ? "grid-view" : "view-list"} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      {filteredPayees.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[styles.emptyHeader, { color: colors.textSecondary }]}>
            {searchQuery ? 'No Payees Found' : 'No Payees Yet'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : 'Add your first payee to see it here.'}
          </Text>
          {searchQuery ? (
            <TouchableOpacity 
              style={[styles.clearFilterButton, { borderColor: colors.border }]} 
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear Search</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
          <FlatList
            key={viewMode} // force re-render across columns dynamically
            data={filteredPayees}
            numColumns={viewMode === 'grid' ? 3 : 1}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridWrapper : undefined}
            showsVerticalScrollIndicator={false}
          />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
         style={[styles.fab, { backgroundColor: colors.primary }]} 
         onPress={() => setAddModalVisible(true)}
         activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Payee Modal */}
      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setAddModalVisible(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add New Payee</Text>
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Payee Name</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Starbucks, Amazon"
              placeholderTextColor={colors.textSecondary}
              value={newPayeeName}
              onChangeText={setNewPayeeName}
              autoFocus
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>Logo URL (Optional)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              value={newPayeeLogo}
              onChangeText={setNewPayeeLogo}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: (!newPayeeName.trim() || isSaving) ? 0.5 : 1 }]} 
              onPress={handleAddPayee}
              disabled={!newPayeeName.trim() || isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Payee</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 60 },
  
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 120 },
  gridWrapper: { justifyContent: 'flex-start' },
  
  payeeCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  payeeCardGrid: { width: '31%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 8, marginHorizontal: '1%' },
  
  logoContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 12 },
  logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoFallback: { fontSize: 20, fontWeight: 'bold' },
  payeeName: { fontSize: 13, fontWeight: '700', flex: 1 },

  emptyHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  clearFilterButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginTop: 12 },
  clearFilterText: { fontWeight: '600', fontSize: 14 },

  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  bottomSheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderTopWidth: 1 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputField: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  
  saveButton: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
