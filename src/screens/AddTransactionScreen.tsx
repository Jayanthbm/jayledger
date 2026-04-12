import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import MIcon from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { getCategories, getPayees, insertOrUpdateTransaction } from '../db/queries';
import { Category, Payee, Transaction } from '../models/types';
import * as Crypto from 'expo-crypto';
import { runFullSync } from '../services/syncService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const formatIconName = (name: string) => {
  if (!name) return 'category';
  let formatted = name.trim();
  if (formatted.startsWith('Md')) {
    formatted = formatted.substring(2);
    formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  return formatted;
};

export default function AddTransactionScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editTx = route.params?.transaction as Transaction | undefined;

  const [amount, setAmount] = useState(editTx ? editTx.amount.toString() : '');
  const [description, setDescription] = useState(editTx ? editTx.description || '' : '');
  const [type, setType] = useState<'Expense' | 'Income'>(editTx ? editTx.type as 'Expense' | 'Income' : 'Expense');
  const [date, setDate] = useState(editTx ? new Date(editTx.transaction_timestamp) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showModal, setShowModal] = useState<'Category' | 'Payee' | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset search when modal opens/closes
    if (!showModal) setModalSearch('');
  }, [showModal]);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      const [cats, p] = await Promise.all([
        getCategories(session.user.id),
        getPayees(session.user.id)
      ]);
      setCategories(cats);
      setPayees(p);
      
      if (editTx) {
          const cat = cats.find(c => c.id === editTx.category_id);
          if (cat) setSelectedCategory(cat);
          
          if (editTx.payee_id) {
              const payee = p.find(pay => pay.id === editTx.payee_id);
              if (payee) setSelectedPayee(payee);
          }
      } else {
          const genCat = cats.find(c => c.name.toLowerCase() === 'general');
          if (genCat) setSelectedCategory(genCat);
      }
    };
    loadData();
  }, [session?.user?.id, editTx]);



  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!session?.user?.id) return;

    setSubmitting(true);
    try {
      const txId = editTx?.id || await Crypto.randomUUID();
      const newTx: Transaction = {
        id: txId,
        amount: parseFloat(amount),
        description: description,
        transaction_timestamp: date.toISOString(),
        date: format(date, 'yyyy-MM-dd'),
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        category_icon: selectedCategory.icon,
        category_app_icon: selectedCategory.app_icon,
        payee_id: selectedPayee?.id || null,
        payee_name: selectedPayee?.name || null,
        payee_logo: selectedPayee?.logo || null,
        type: type,
        user_id: session.user.id,
        created_at: editTx?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 1
      };

      await insertOrUpdateTransaction(newTx, 1);
      runFullSync(session.user.id).catch(err => console.error("Background sync failed", err));
      
      Alert.alert('Success', 'Transaction saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (modalType: 'Category' | 'Payee') => {
    const rawData = modalType === 'Category' ? categories.filter(c => c.type === type) : payees;
    const filteredData = rawData.filter(item => 
      item.name.toLowerCase().includes(modalSearch.toLowerCase())
    );
    const iconColor = type === 'Income' ? '#10b981' : '#ef4444';
    const iconBg = type === 'Income' ? '#10b98115' : '#ef444415';

    return (
      <Modal visible={showModal === modalType} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: '#18181b' }]}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowModal(null)} style={[styles.pillIconBg, { backgroundColor: '#2a2a2a' }]}>
                        <Icon name="close" size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: 'white' }]}>Select {modalType}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder={`Search ${modalType.toLowerCase()}...`}
                      placeholderTextColor="#444"
                      value={modalSearch}
                      onChangeText={setModalSearch}
                    />
                </View>

                <FlatList
                    data={filteredData}
                    keyExtractor={item => item.id}
                    numColumns={4}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
                    renderItem={({ item }: { item: Category | Payee }) => {
                        const isSelected = (modalType === 'Category' ? (selectedCategory as Category)?.id : (selectedPayee as Payee)?.id) === item.id;
                        return (
                            <TouchableOpacity 
                                style={styles.gridItem}
                                onPress={() => {
                                    if (modalType === 'Category') setSelectedCategory(item as Category);
                                    else setSelectedPayee(item as Payee);
                                    setShowModal(null);
                                }}
                            >
                                <View style={[styles.gridIconBox, { backgroundColor: isSelected ? iconColor : iconBg, borderColor: isSelected ? iconColor : '#333' }]}>
                                    <Icon 
                                      name={formatIconName((item as any).app_icon || (modalType === 'Category' ? 'category' : 'person')) as any} 
                                      size={24} 
                                      color={isSelected ? 'white' : iconColor} 
                                    />
                                </View>
                                <Text style={[styles.gridLabel, { color: isSelected ? 'white' : '#888' }]} numberOfLines={1}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                      <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: '#666' }}>No {modalType.toLowerCase()} found</Text>
                      </View>
                    }
                />
            </View>
        </View>
      </Modal>
    );
  };

  const currentIconColor = type === 'Income' ? '#10b981' : '#ef4444';
  const currentIconBg = type === 'Income' ? '#10b98120' : '#ef444420';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>

          {/* ── Top Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{editTx ? 'Edit Transaction' : 'Add Transaction'}</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
              <Icon name="close" size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* ── Segment Tabs (Only for New Transactions) ── */}
          {!editTx && (
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentTab, type === 'Expense' && styles.segmentTabActiveExpense]}
                onPress={() => setType('Expense')}
              >
                <Text style={[styles.segmentText, { color: type === 'Expense' ? 'white' : '#666' }]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentTab, type === 'Income' && styles.segmentTabActiveIncome]}
                onPress={() => setType('Income')}
              >
                <Text style={[styles.segmentText, { color: type === 'Income' ? 'white' : '#666' }]}>Income</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Date / Time Row ── */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeChip} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar-today" size={14} color="#888" style={{ marginRight: 6 }} />
              <Text style={styles.dateTimeText}>{format(date, 'dd MMM yyyy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateTimeChip} onPress={() => setShowTimePicker(true)}>
              <Icon name="schedule" size={14} color="#888" style={{ marginRight: 6 }} />
              <Text style={styles.dateTimeText}>{format(date, 'h:mm a')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Main Card ── */}
          <View style={styles.card}>

            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={[styles.currencySymbol, { color: currentIconColor }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: currentIconColor }]}
                placeholder="0"
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!editTx}
              />
            </View>

            <View style={styles.divider} />

            {/* Description */}
            <TextInput
              style={styles.descInput}
              placeholder="Add a note or description..."
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              maxLength={255}
            />

            <View style={styles.divider} />

            {/* Payee | Category */}
            <View style={styles.selectorRow}>
              <TouchableOpacity style={styles.selectorHalf} onPress={() => setShowModal('Payee')}>
                <View style={[styles.selectorIconBg, { backgroundColor: '#2a2a2a' }]}>
                  <Icon name="person-outline" size={18} color="#888" />
                </View>
                <View>
                  <Text style={styles.selectorLabel}>Payee</Text>
                  <Text style={styles.selectorValue} numberOfLines={1}>{selectedPayee?.name || 'Select'}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              <TouchableOpacity style={styles.selectorHalf} onPress={() => setShowModal('Category')}>
                <View style={[styles.selectorIconBg, { backgroundColor: currentIconBg }]}>
                  <Icon name={formatIconName(selectedCategory?.app_icon || selectedCategory?.icon || 'grid-view') as any} size={18} color={currentIconColor} />
                </View>
                <View>
                  <Text style={styles.selectorLabel}>Category</Text>
                  <Text style={styles.selectorValue} numberOfLines={1}>{selectedCategory?.name || 'Select'}</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>

          <View style={{ height: 32 }} />

          {/* ── Save Button (outside card) ── */}
          <View style={styles.bottomArea}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: currentIconColor }, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={styles.saveBtnText}>Save Transaction</Text>
                    <Icon name="check-circle" size={20} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* Date / Time pickers */}
          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default"
              onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
          )}
          {showTimePicker && (
            <DateTimePicker value={date} mode="time" display="default"
              onChange={(_, t) => { setShowTimePicker(false); if (t) setDate(t); }} />
          )}

          {renderModal('Category')}
          {renderModal('Payee')}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 52,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },

  /* Segment tabs */
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentTabActiveExpense: {
    backgroundColor: '#ef4444',
  },
  segmentTabActiveIncome: {
    backgroundColor: '#10b981',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '700',
  },

  /* Date / Time row */
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dateTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  dateTimeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Main card */
  card: {
    marginHorizontal: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '700',
    minWidth: 100,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 4,
  },
  descInput: {
    color: 'white',
    fontSize: 15,
    fontWeight: '400',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
  },
  selectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  selectorHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    alignSelf: 'stretch',
  },
  selectorIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700',
    marginTop: 2,
  },

  /* Bottom area */
  bottomArea: {
    padding: 20,
    paddingBottom: 36,
  },
  saveBtn: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: 'white',
    fontSize: 15,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    margin: 6,
    padding: 8,
  },
  gridIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Pill icon bg - used in modal close button */
  pillIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


