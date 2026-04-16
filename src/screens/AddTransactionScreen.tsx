import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { getCategories, getPayees, insertOrUpdateTransaction } from '../db/queries';
import { BottomSheet } from '../components/BottomSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { SearchBar } from '../components/SearchBar';
import { Category, Payee, Transaction } from '../models/types';
import * as Crypto from 'expo-crypto';
import { syncTransactions } from '../services/syncService';

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
  const insets = useSafeAreaInsets();

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

      const quickTx = route.params?.quickTransaction as any;

      if (editTx) {
          const cat = cats.find(c => c.id === editTx.category_id);
          if (cat) setSelectedCategory(cat);

          if (editTx.payee_id) {
              const payee = p.find(pay => pay.id === editTx.payee_id);
              if (payee) setSelectedPayee(payee);
          }
      } else if (quickTx) {
        setType(quickTx.type as any);
        if (quickTx.amount) setAmount(quickTx.amount.toString());
        if (quickTx.description) setDescription(quickTx.description);

        if (quickTx.category_id) {
          const cat = cats.find(c => c.id === quickTx.category_id);
          if (cat) setSelectedCategory(cat);
        }
        if (quickTx.payee_id) {
          const payee = p.find(pay => pay.id === quickTx.payee_id);
          if (payee) setSelectedPayee(payee);
        }
      } else {
          const genCat = cats.find(c => c.name.toLowerCase() === 'general');
          if (genCat) setSelectedCategory(genCat);
      }
    };
    loadData();
  }, [session?.user?.id, editTx, route.params?.quickTransaction]);

  useEffect(() => {
    // Apply default categories when type changes (only for new transactions and non-quick-tx)
    if (!editTx && !route.params?.quickTransaction && categories.length > 0) {
      if (type === 'Income') {
        const salCat = categories.find(c => c.name.toLowerCase() === 'salary');
        if (salCat) setSelectedCategory(salCat);
      } else {
        const genCat = categories.find(c => c.name.toLowerCase() === 'general');
        if (genCat) setSelectedCategory(genCat);
      }
    }
  }, [type, editTx, categories, route.params?.quickTransaction]);

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
        sync_status: 1,
        tid: editTx?.tid || 0
      };

      await insertOrUpdateTransaction(newTx, 1);
      syncTransactions(session.user.id, true).catch(err => console.error("Background sync failed", err));

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

    // Add "None" option for Payees
    const displayData = modalType === 'Payee'
        ? [{ id: 'none', name: 'None' }, ...rawData] as (Category | Payee)[]
        : rawData;

    const filteredData = displayData.filter(item =>
      item.name.toLowerCase().includes(modalSearch.toLowerCase())
    );
    const iconColor = type === 'Income' ? colors.success : colors.danger;
    const iconBg = type === 'Income' ? colors.success + '15' : colors.danger + '15';

    return (
      <BottomSheet
        visible={showModal === modalType}
        onClose={() => setShowModal(null)}
        title={`Select ${modalType}`}
      >
        <View style={{ maxHeight: 500 }}>
          {/* Search Bar */}
          <View style={{ paddingBottom: 16 }}>
            <SearchBar
              value={modalSearch}
              onChangeText={setModalSearch}
              placeholder={`Search ${modalType.toLowerCase()}...`}
              size="medium"
              onClear={() => setModalSearch('')}
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
                    if (modalType === 'Category') {
                      setSelectedCategory(item as Category);
                    } else {
                      setSelectedPayee(item.id === 'none' ? null : item as Payee);
                    }
                    setShowModal(null);
                  }}
                >
                  <View style={[styles.gridIconBox, {
                    backgroundColor: isSelected ? iconColor : iconBg,
                    borderColor: isSelected ? iconColor : colors.border
                  }]}>
                    <Icon
                      name={formatIconName((item as any).app_icon || (modalType === 'Category' ? 'category' : 'person')) as any}
                      size={24}
                      color={isSelected ? 'white' : iconColor}
                    />
                  </View>
                  <Text style={[styles.gridLabel, { color: isSelected ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: '#666' }}>No {modalType.toLowerCase()} found</Text>
              </View>
            }
            style={{ maxHeight: 400 }}
          />
        </View>
      </BottomSheet>
    );
  };

  const currentIconColor = type === 'Income' ? colors.success : colors.danger;
  const currentIconBg = type === 'Income' ? colors.success + '20' : colors.danger + '20';

  return (
    <View style={{ flex: 1 }}>
      <BottomSheet
        visible={true}
        onClose={() => navigation.goBack()}
        title={editTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {!editTx && (
                <SegmentedControl
                  options={[
                    { label: 'Expense', value: 'Expense', activeColor: colors.danger },
                    { label: 'Income', value: 'Income', activeColor: colors.success }
                  ]}
                  selectedValue={type}
                  onValueChange={(val: 'Expense' | 'Income') => setType(val)}
                  variant="medium"
                  containerStyle={{ marginBottom: 12 }}
                />
              )}

              {/* Date / Time Row */}
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={[styles.dateTimeChip, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
                  <Icon name="calendar-today" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>{format(date, 'dd MMM yyyy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateTimeChip, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowTimePicker(true)}>
                  <Icon name="schedule" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>{format(date, 'h:mm a')}</Text>
                </TouchableOpacity>
              </View>

              {/* Amount & Description Row */}
              <View style={[styles.mainFormCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.amountRow}>
                  <Text style={[styles.currencySymbol, { color: currentIconColor }]}>₹</Text>
                  <TextInput
                    style={[styles.amountInput, { color: currentIconColor }]}
                    placeholder="0"
                    placeholderTextColor={colors.border}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={!editTx}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <TextInput
                  style={[styles.descInput, { color: colors.text }]}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textSecondary + '70'}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={255}
                />
              </View>

              {/* Selector Row */}
              <View style={styles.selectorRow}>
                <TouchableOpacity style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowModal('Payee')}>
                  <View style={[styles.selectorIconBg, { backgroundColor: colors.card }]}>
                    <Icon name="person-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Payee</Text>
                    <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>{selectedPayee?.name || 'Select'}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowModal('Category')}>
                  <View style={[styles.selectorIconBg, { backgroundColor: currentIconBg }]}>
                    <Icon name={formatIconName(selectedCategory?.app_icon || selectedCategory?.icon || 'grid-view') as any} size={18} color={currentIconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Category</Text>
                    <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>{selectedCategory?.name || 'Select'}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: currentIconColor }, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Transaction</Text>}
            </TouchableOpacity>

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
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateTimeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainFormCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 3,
    overflow: 'hidden',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'left',
  },
  divider: {
    height: 1,
  },
  descInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  selectorIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  saveBtn: {
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  pillIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
