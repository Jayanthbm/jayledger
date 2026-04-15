import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getCategories, getPayees, insertQuickTransaction, updateQuickTransaction } from '../db/queries';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Category, Payee, QuickTransaction } from '../models/types';
import * as Crypto from 'expo-crypto';

const formatIconName = (name: string) => {
  if (!name) return 'category';
  return name.replace('-outline', '').replace('circle', 'radio-button-unchecked');
};

export default function AddQuickTransactionScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editQt = route.params?.quickTransaction as QuickTransaction | undefined;

  const [name, setName] = useState(editQt?.name || '');
  const [type, setType] = useState<'Income' | 'Expense'>(editQt?.type as any || 'Expense');
  const [amount, setAmount] = useState(editQt?.amount ? editQt.amount.toString() : '');
  const [description, setDescription] = useState(editQt?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showModal, setShowModal] = useState<'Category' | 'Payee' | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      const [cats, p] = await Promise.all([
        getCategories(session.user.id),
        getPayees(session.user.id)
      ]);
      setCategories(cats);
      setPayees(p);

      if (editQt) {
        if (editQt.category_id) {
          const cat = cats.find(c => c.id === editQt.category_id);
          if (cat) setSelectedCategory(cat);
        }
        if (editQt.payee_id) {
          const payee = p.find(pay => pay.id === editQt.payee_id);
          if (payee) setSelectedPayee(payee);
        }
      }
    };
    loadData();
  }, [session?.user?.id, editQt]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this template');
      return;
    }
    if (!session?.user?.id) return;

    setSubmitting(true);
    try {
      const qt: QuickTransaction = {
        id: editQt?.id || Crypto.randomUUID(),
        name: name.trim(),
        type,
        amount: amount ? parseFloat(amount) : undefined,
        category_id: selectedCategory?.id,
        payee_id: selectedPayee?.id,
        description: description.trim(),
        user_id: session.user.id
      };

      if (editQt) {
        await updateQuickTransaction(qt);
      } else {
        await insertQuickTransaction(qt);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Save Quick Transaction Error:", error);
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (modalType: 'Category' | 'Payee') => {
    const rawData = modalType === 'Category' ? categories.filter(c => c.type === type) : payees;
    const displayData = modalType === 'Payee' ? [{ id: 'none', name: 'None' }, ...rawData] : rawData;
    const filteredData = displayData.filter(item => item.name.toLowerCase().includes(modalSearch.toLowerCase()));

    const iconColor = type === 'Income' ? colors.success : colors.danger;
    const iconBg = type === 'Income' ? colors.success + '15' : colors.danger + '15';

    return (
      <Modal visible={showModal === modalType} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowModal(null)} style={[styles.pillIconBg, { backgroundColor: colors.background }]}>
                <Icon name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select {modalType}</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={[styles.searchContainer, { backgroundColor: colors.background, marginHorizontal: 16, marginBottom: 10 }]}>
              <Icon name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={`Search ${modalType.toLowerCase()}...`}
                placeholderTextColor={colors.textSecondary + '70'}
                value={modalSearch}
                onChangeText={setModalSearch}
              />
            </View>
            <FlatList
              data={filteredData}
              keyExtractor={item => item.id}
              numColumns={4}
              contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
              renderItem={({ item }: any) => {
                const isSelected = (modalType === 'Category' ? selectedCategory?.id : selectedPayee?.id) === item.id;
                return (
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => {
                      if (modalType === 'Category') setSelectedCategory(item);
                      else setSelectedPayee(item.id === 'none' ? null : item);
                      setShowModal(null);
                      setModalSearch('');
                    }}
                  >
                    <View style={[styles.gridIconBox, { backgroundColor: isSelected ? iconColor : iconBg, borderColor: isSelected ? iconColor : colors.border }]}>
                      <Icon name={formatIconName((item as any).app_icon || (modalType === 'Category' ? 'category' : 'person')) as any} size={24} color={isSelected ? 'white' : iconColor} />
                    </View>
                    <Text style={[styles.gridLabel, { color: isSelected ? colors.primary : colors.textSecondary }]} numberOfLines={1}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const currentIconColor = type === 'Income' ? colors.success : colors.danger;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          {/* Transparent Overlay to dismiss */}
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={() => navigation.goBack()} 
          />

          {/* Bottom Sheet Content */}
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Header Area in Sheet */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {editQt ? 'Edit Template' : 'New Template'}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sheetCloseBtn}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Template Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Morning Coffee"
                placeholderTextColor={colors.textSecondary + '70'}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.typeContainer}>
                <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.background, borderColor: type === 'Expense' ? colors.danger : colors.border }]} onPress={() => setType('Expense')}>
                  <Icon name="remove-circle-outline" size={20} color={type === 'Expense' ? colors.danger : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: type === 'Expense' ? colors.danger : colors.textSecondary }]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.background, borderColor: type === 'Income' ? colors.success : colors.border }]} onPress={() => setType('Income')}>
                  <Icon name="add-circle-outline" size={20} color={type === 'Income' ? colors.success : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: type === 'Income' ? colors.success : colors.textSecondary }]}>Income</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Default Amount (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary + '70'}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                  <TouchableOpacity style={[styles.input, styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowModal('Category')}>
                    <Icon name={formatIconName(selectedCategory?.app_icon || 'category') as any} size={20} color={selectedCategory ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.pickerText, { color: selectedCategory ? colors.text : colors.textSecondary }]}>{selectedCategory?.name || 'Select'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Payee</Text>
                  <TouchableOpacity style={[styles.input, styles.picker, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowModal('Payee')}>
                    <Icon name="person" size={20} color={selectedPayee ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.pickerText, { color: selectedPayee ? colors.text : colors.textSecondary }]}>{selectedPayee?.name || 'Select'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Default Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Daily caffeine fix"
                placeholderTextColor={colors.textSecondary + '70'}
                multiline
                value={description}
                onChangeText={setDescription}
              />
              
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: currentIconColor }, submitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Template</Text>}
            </TouchableOpacity>
          </View>

          {renderModal('Category')}
          {renderModal('Payee')}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  content: { paddingBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', gap: 12, marginTop: 24 },
  typeBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeText: { fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  modalOverlayInner: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingVertical: 24, maxHeight: '85%', borderTopWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  pillIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 14, paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  gridIconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  gridLabel: { fontSize: 12, fontWeight: '600', maxWidth: '90%', textAlign: 'center' }
});
