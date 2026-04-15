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

interface FilterSelectorProps {
  type: 'Category' | 'Payee';
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  payees: Payee[];
  selectedItems: string[];
  tempSelectedItems: string[];
  setTempSelectedItems: React.Dispatch<React.SetStateAction<string[]>>;
  onApply: (selected: string[]) => void;
  colors: any;
  modalSearch: string;
  setModalSearch: (text: string) => void;
  formatIconName: (name: string) => string;
}

const FilterSelector = React.memo(({
  type, visible, onClose, categories, payees, 
  selectedItems, tempSelectedItems, setTempSelectedItems, 
  onApply, colors, modalSearch, setModalSearch, formatIconName
}: FilterSelectorProps) => {
  const data = (type === 'Category' ? categories : payees).filter(item => 
    item.name.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const toggleTempSelection = (id: string) => {
    setTempSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select {type === 'Category' ? 'Categories' : 'Payees'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.modalSearchContainer, { backgroundColor: colors.background }]}>
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder={`Search ${type}...`}
              placeholderTextColor={colors.textSecondary + '80'}
              style={[styles.modalSearchInput, { color: colors.text }]}
              value={modalSearch}
              onChangeText={setModalSearch}
            />
          </View>

          <FlatList
            data={data as any[]}
            keyExtractor={item => item.id}
            numColumns={4}
            renderItem={({ item }) => {
              const isSelected = tempSelectedItems.includes(item.id);
              return (
                <TouchableOpacity 
                  style={styles.gridItem} 
                  onPress={() => toggleTempSelection(item.id)}
                >
                  <View style={[
                    styles.gridIconBox, 
                    { 
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border
                    }
                  ]}>
                    <Icon 
                      name={formatIconName((item as any).app_icon || (type === 'Category' ? 'category' : 'person')) as any} 
                      size={24} 
                      color={isSelected ? 'white' : colors.textSecondary} 
                    />
                  </View>
                  <Text 
                    style={[styles.gridLabel, { color: isSelected ? colors.primary : colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          
          <TouchableOpacity 
            style={[styles.modalDone, { backgroundColor: colors.primary }]} 
            onPress={() => onApply(tempSelectedItems)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

interface DeleteConfirmModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
  colors: any;
}

const DeleteConfirmModal = React.memo(({ transaction, onCancel, onConfirm, colors }: DeleteConfirmModalProps) => (
  <Modal visible={!!transaction} animationType="fade" transparent>
    <View style={styles.deleteOverlay}>
      <View style={[styles.deleteSheet, { backgroundColor: colors.card }]}>
        <View style={styles.deleteHeader}>
          <View style={[styles.deleteIconBg, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="delete-outline" size={28} color={colors.danger} />
          </View>
          <Text style={[styles.deleteTitle, { color: colors.text }]}>Delete Transaction?</Text>
          <Text style={[styles.deleteSub, { color: colors.textSecondary }]}>This action cannot be undone.</Text>
        </View>

        <View style={styles.deleteActions}>
          <TouchableOpacity 
            style={[styles.deleteBtn, { backgroundColor: colors.danger }]} 
            onPress={onConfirm}
          >
            <Text style={styles.deleteBtnText}>Confirm Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelDeleteBtn} 
            onPress={onCancel}
          >
            <Text style={[styles.cancelDeleteText, { color: colors.textSecondary }]}>Keep Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
));

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
  const [tempSelectedCats, setTempSelectedCats] = useState<string[]>([]);
  const [tempSelectedPayees, setTempSelectedPayees] = useState<string[]>([]);
  
  // Master data for filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showFilterModal, setShowFilterModal] = useState<'Category' | 'Payee' | null>(null);
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const route = navigation.getState().routes[navigation.getState().index];
  const params = route.params as any;

  useEffect(() => {
    if (params?.initialSelectedCats) {
      setSelectedCats(params.initialSelectedCats);
    }
    if (params?.initialStartDate) {
      setStartDate(params.initialStartDate);
    }
    if (params?.initialEndDate) {
      setEndDate(params.initialEndDate);
    }
  }, [params]);

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

    if (startDate) {
      query += ` AND date >= '${startDate}'`;
    }
    if (endDate) {
      query += ` AND date <= '${endDate}'`;
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
    setDeleteConfirmTx(tx);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmTx || !session?.user?.id) return;
    await deleteTransactionAsync(deleteConfirmTx.id, session.user.id);
    setDeleteConfirmTx(null);
    loadData();
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

  useEffect(() => {
    if (showFilterModal === 'Category') {
      setTempSelectedCats([...selectedCats]);
    } else if (showFilterModal === 'Payee') {
      setTempSelectedPayees([...selectedPayees]);
    }
  }, [showFilterModal, selectedCats, selectedPayees]);

  const handleRefresh = async () => {
    if (!session?.user?.id) return;
    setRefreshing(true);
    await runFullSync(session.user.id, true);
    await loadData();
    setRefreshing(false);
  };

  const handleFilterCategory = (catId: string) => {
    setSelectedCats([catId]);
    setSearch('');
  };

  const handleFilterPayee = (payeeId: string | null) => {
    if (payeeId) {
      setSelectedPayees([payeeId]);
      setSearch('');
    }
  };

  const renderItem = useCallback(({ item }: { item: Transaction }) => {
    return (
      <TransactionCard 
        transaction={item} 
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onFilterCategory={handleFilterCategory}
        onFilterPayee={handleFilterPayee}
      />
    );
  }, [session?.user?.id]);

  const formatIconName = useCallback((name: string) => {
    if (!name) return 'category';
    let formatted = name.trim();
    if (formatted.startsWith('Md')) {
      formatted = formatted.substring(2);
      formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    return formatted;
  }, []);


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
        <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
          <View style={[styles.filterChip, { 
            backgroundColor: selectedCats.length > 0 ? colors.primary + '15' : 'transparent',
            borderColor: selectedCats.length > 0 ? colors.primary : colors.border 
          }]}>
            <TouchableOpacity 
              onPress={() => setShowFilterModal('Category')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="category" size={16} color={selectedCats.length > 0 ? colors.primary : colors.textSecondary} style={{marginRight: 4}} />
              <Text style={[styles.filterChipText, { color: selectedCats.length > 0 ? colors.primary : colors.textSecondary }]}>
                {selectedCats.length > 0 ? `${selectedCats.length} Mixed` : 'Categories'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={selectedCats.length > 0 ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
            {selectedCats.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedCats([])} style={styles.smallClose}>
                <Icon name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.filterChip, { 
            backgroundColor: selectedPayees.length > 0 ? colors.primary + '15' : 'transparent',
            borderColor: selectedPayees.length > 0 ? colors.primary : colors.border 
          }]}>
            <TouchableOpacity 
              onPress={() => setShowFilterModal('Payee')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Icon name="person" size={16} color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary} style={{marginRight: 4}} />
              <Text style={[styles.filterChipText, { color: selectedPayees.length > 0 ? colors.primary : colors.textSecondary }]}>
                {selectedPayees.length > 0 ? `${selectedPayees.length} Payees` : 'Payees'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color={selectedPayees.length > 0 ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
            {selectedPayees.length > 0 && (
              <TouchableOpacity onPress={() => setSelectedPayees([])} style={styles.smallClose}>
                <Icon name="close" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
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

      <FilterSelector 
        type="Category"
        visible={showFilterModal === 'Category'}
        onClose={() => setShowFilterModal(null)}
        categories={categories}
        payees={payees}
        selectedItems={selectedCats}
        tempSelectedItems={tempSelectedCats}
        setTempSelectedItems={setTempSelectedCats}
        onApply={(selected) => { setSelectedCats(selected); setShowFilterModal(null); setModalSearch(''); }}
        colors={colors}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        formatIconName={formatIconName}
      />
      <FilterSelector 
        type="Payee"
        visible={showFilterModal === 'Payee'}
        onClose={() => setShowFilterModal(null)}
        categories={categories}
        payees={payees}
        selectedItems={selectedPayees}
        tempSelectedItems={tempSelectedPayees}
        setTempSelectedItems={setTempSelectedPayees}
        onApply={(selected) => { setSelectedPayees(selected); setShowFilterModal(null); setModalSearch(''); }}
        colors={colors}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        formatIconName={formatIconName}
      />
      <DeleteConfirmModal 
        transaction={deleteConfirmTx}
        onCancel={() => setDeleteConfirmTx(null)}
        onConfirm={confirmDelete}
        colors={colors}
      />

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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, alignItems: 'center', gap: 8 },
  filterChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 24, 
    borderWidth: 1.5, 
    backgroundColor: 'transparent' 
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  smallClose: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clearBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    maxHeight: '85%',
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalDone: { 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  deleteSheet: {
    marginHorizontal: 16,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  deleteHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteSub: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deleteActions: {
    width: '100%',
    gap: 12,
  },
  deleteBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelDeleteBtn: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
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
