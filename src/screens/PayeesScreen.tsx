import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Keyboard } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { Payee } from '../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { getRelativeTime } from '../utils/dateUtils';
import { SearchBar } from '../components/SearchBar';
import { useToast } from '../store/ToastContext';

import {
  fetchPayeesData,
  savePayeeViewMode,
  addPayee,
  performPayeeSync
} from '../services/payeeService';

// Modular Components
import { PayeeCard } from '../components/payees/PayeeCard';
import { PayeeAddModal } from '../components/payees/PayeeAddModal';
import { FloatingActionButton } from '../components/FloatingActionButton';

export default function PayeesScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const user = session?.user;
  const { showToast } = useToast();
  const navigation = useNavigation<any>();

  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  
  const listRef = useRef<FlatList>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { payees: fetchedPayees, viewMode: savedMode } = await fetchPayeesData(user.id);
      setPayees(fetchedPayees);
      setViewMode(savedMode);
    } catch (err) {
      console.error("[Payees] loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleViewMode = async () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    if (user?.id) {
      await savePayeeViewMode(user.id, newMode);
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!user?.id) return;
    setSyncing(true);
    try {
      const updatedPayees = await performPayeeSync(user.id);
      setPayees(updatedPayees);
      showToast('Payees synced successfully', 'success');
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSyncing(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity activeOpacity={0.7} onPress={scrollToTop} style={{ alignItems: 'flex-start' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Payees</Text>
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
  }, [navigation, handleManualSync, syncing, colors.text, colors.primary, scrollToTop]);

  const handleAddPayeeSubmit = async (name: string, logo: string) => {
    if (!user?.id) return;
    const newPayee = await addPayee(user.id, name, logo);
    setPayees(prev => [...prev, newPayee]);
    showToast('Payee added successfully', 'success');
  };

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerTools}>
        <View style={styles.headerControls}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search payees..."
            size="medium"
            containerStyle={{ flex: 1 }}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => setSortAsc(!sortAsc)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="sort" size={18} color={colors.primary} />
                <MaterialIcons name={sortAsc ? "arrow-upward" : "arrow-downward"} size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={toggleViewMode}
            >
              <MaterialIcons name={viewMode === 'list' ? "grid-view" : "view-list"} size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.captionRow}>
          <Text style={[styles.sortCaption, { color: colors.textSecondary }]}>Sorted by Name</Text>
        </View>
      </View>

      {filteredPayees.length === 0 ? (
        <View style={styles.emptyCentered}>
          <MaterialIcons name="storefront" size={64} color={colors.border} />
          <Text style={[styles.emptyHeader, { color: colors.textSecondary }]}>{searchQuery ? 'No Payees Found' : 'No Payees Yet'}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{searchQuery ? `We couldn't find anything matching "${searchQuery}".` : 'Add your first payee to see it here.'}</Text>
          {searchQuery && (
            <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key={viewMode}
          data={filteredPayees}
          numColumns={viewMode === 'grid' ? 3 : 1}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PayeeCard
              item={item}
              viewMode={viewMode}
              colors={colors}
              onPress={(p) => navigation.navigate('Main', {
                screen: 'Transactions',
                params: { initialSelectedPayees: [p.id] }
              })}
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

      <PayeeAddModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddPayeeSubmit}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, marginTop: 60 },
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortButton: { width: 64, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  captionRow: { marginTop: 4, alignItems: 'flex-end' },
  sortCaption: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 120 },
  gridWrapper: { justifyContent: 'flex-start' },
  emptyHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  clearSearchBtn: { paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderRadius: 20, marginTop: 12, borderColor: '#ccc' },
});
