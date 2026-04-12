import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, Modal, FlatList } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { runFullSync } from '../services/syncService';
import { Transaction, Category, Payee } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { TransactionCard } from '../components/TransactionCard';
import { getCategories, getPayees, deleteTransactionAsync } from '../db/queries';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<{ title: string, data: Transaction[] }[]>([]);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedPayees, setSelectedPayees] = useState<string[]>([]);
  
  // Master data for filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showFilterModal, setShowFilterModal] = useState<'Category' | 'Payee' | null>(null);

  const loadFilterData = useCallback(async () => {
    if (!session?.user?.id) return;
    const [cats, p] = await Promise.all([
      getCategories(session.user.id),
      getPayees(session.user.id)
    ]);
    setCategories(cats);
    setPayees(p);
  }, [session?.user?.id]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const db = getDb();
    
    let query = `SELECT * FROM transactions WHERE user_id = '${session.user.id}' AND deleted = 0`;
    
    // Search logic
    if (search.trim()) {
      const s = search.trim().replace(/'/g, "''");
      if (/^-?\d+(\.\d+)?$/.test(s)) {
        query += ` AND amount = ${s}`;
      } else {
        query += ` AND (description LIKE '%${s}%' OR CAST(amount AS TEXT) LIKE '%${s}%')`;
      }
    }
    
    // Filter logic
    if (selectedCats.length > 0) {
      const catIdsString = selectedCats.map(id => `'${id}'`).join(',');
      query += ` AND category_id IN (${catIdsString})`;
    }
    
    if (selectedPayees.length > 0) {
      const payeeIdsString = selectedPayees.map(id => `'${id}'`).join(',');
      query += ` AND payee_id IN (${payeeIdsString})`;
    }
    
    query += ` ORDER BY date DESC, transaction_timestamp DESC`;
    
    const rows = await db.getAllAsync<Transaction>(query);

    const grouped = rows.reduce((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const formattedSections = Object.entries(grouped).map(([date, data]) => ({
      title: format(new Date(date), 'MMM dd, yyyy'),
      data,
    }));

    setSections(formattedSections);
    setLoading(false);
  }, [session?.user?.id, search, selectedCats, selectedPayees]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteTransaction = async (tx: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!session?.user?.id) return;
            await deleteTransactionAsync(tx.id, session.user.id);
            loadData();
          }
        }
      ]
    );
  };

  const handleEditTransaction = (tx: Transaction) => {
    navigation.navigate('AddTransaction', { transaction: tx });
  };

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [loadData]);

  const handleRefresh = async () => {
    if (!session?.user?.id) return;
    setRefreshing(true);
    await runFullSync(session.user.id, true);
    await loadData();
    setRefreshing(false);
  };

  const toggleSelection = (id: string, type: 'Category' | 'Payee') => {
    if (type === 'Category') {
      setSelectedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setSelectedPayees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const renderItem = useCallback(({ item }: { item: Transaction }) => {
    return (
      <TransactionCard 
        transaction={item} 
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />
    );
  }, [session?.user?.id]);

  const FilterSelector = ({ type }: { type: 'Category' | 'Payee' }) => {
    const data = type === 'Category' ? categories : payees;
    const selected = type === 'Category' ? selectedCats : selectedPayees;
    
    return (
      <Modal visible={showFilterModal === type} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select {type}s</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(null)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data as any[]}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.filterItem, { borderBottomColor: colors.border }]} 
                  onPress={() => toggleSelection(item.id, type)}
                >
                  <Text style={[styles.filterItemText, { color: colors.text }]}>{item.name}</Text>
                  {selected.includes(item.id) && <Icon name="check-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={[styles.modalDone, { backgroundColor: colors.primary }]} 
              onPress={() => setShowFilterModal(null)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary + '80'}
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterChip, { borderColor: selectedCats.length > 0 ? colors.primary : colors.border }]} 
          onPress={() => setShowFilterModal('Category')}
        >
          <Text style={[styles.filterChipText, { color: selectedCats.length > 0 ? colors.primary : colors.textSecondary }]}>
            Categories {selectedCats.length > 0 ? `(${selectedCats.length})` : ''}
          </Text>
          <Icon name="arrow-drop-down" size={20} color={selectedCats.length > 0 ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterChip, { borderColor: selectedPayees.length > 0 ? colors.primary : colors.border }]} 
          onPress={() => setShowFilterModal('Payee')}
        >
          <Text style={[styles.filterChipText, { color: selectedPayees.length > 0 ? colors.primary : colors.textSecondary }]}>
            Payees {selectedPayees.length > 0 ? `(${selectedPayees.length})` : ''}
          </Text>
          <Icon name="arrow-drop-down" size={20} color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        {(selectedCats.length > 0 || selectedPayees.length > 0 || search) && (
          <TouchableOpacity onPress={() => { setSelectedCats([]); setSelectedPayees([]); setSearch(''); }}>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: 'bold' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.header, { backgroundColor: colors.background, color: colors.textSecondary }]}>
            {title}
          </Text>
        )}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={loading ? <ActivityIndicator style={{marginTop: 40}} color={colors.primary} /> : (
            <View style={styles.emptyContainer}>
                <Icon name="search-off" size={64} color={colors.border} />
                <Text style={{color: colors.textSecondary, marginTop: 12}}>No transactions found</Text>
            </View>
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <FilterSelector type="Category" />
      <FilterSelector type="Payee" />

      {/* Add FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 1 
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, alignItems: 'center', gap: 8 },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    backgroundColor: 'transparent' 
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24, 
    maxHeight: '80%',
    borderTopWidth: 1
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  filterItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  filterItemText: { fontSize: 16 },
  modalDone: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 }
});
