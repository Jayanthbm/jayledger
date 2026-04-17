import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import {
  getCategories,
  getPayees,
  insertQuickTransaction,
  updateQuickTransaction,
} from '../db/queries';
import { BottomSheet } from '../components/BottomSheet';
import { SegmentedControl } from '../components/SegmentedControl';
import { SearchBar } from '../components/SearchBar';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import { Category, Payee, QuickTransaction } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { common } from '../styles/common';

const formatIconName = (name: string) => {
  if (!name) return 'category';
  return name.replace('-outline', '').replace('circle', 'radio-button-unchecked');
};

export default function AddQuickTransactionScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddQuickTransaction'>>();
  const editQt = route.params?.quickTransaction as QuickTransaction | undefined;
  const { showToast } = useToast();

  const [name, setName] = useState(editQt?.name || '');
  const [type, setType] = useState<'Income' | 'Expense'>(
    (editQt?.type as 'Income' | 'Expense') || 'Expense',
  );
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
        getPayees(session.user.id),
      ]);
      setCategories(cats);
      setPayees(p);

      if (editQt) {
        if (editQt.category_id) {
          const cat = cats.find((c) => c.id === editQt.category_id);
          if (cat) setSelectedCategory(cat);
        }
        if (editQt.payee_id) {
          const payee = p.find((pay) => pay.id === editQt.payee_id);
          if (payee) setSelectedPayee(payee);
        }
      }
    };
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [session, editQt]);

  useEffect(() => {
    if (!editQt && categories.length > 0) {
      const timer = setTimeout(() => {
        if (type === 'Income') {
          const salCat = categories.find((c) => c.name.toLowerCase() === 'salary');
          if (salCat) setSelectedCategory(salCat);
        } else {
          const genCat = categories.find((c) => c.name.toLowerCase() === 'general');
          if (genCat) setSelectedCategory(genCat);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [type, editQt, categories]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter a name for this template', 'error');
      return;
    }
    if (!session?.user?.id) return;

    setSubmitting(true);
    try {
      const qt: QuickTransaction = {
        id: editQt?.id || generateUUID(),
        name: name.trim(),
        type,
        amount: amount ? parseFloat(amount) : undefined,
        category_id: selectedCategory?.id,
        payee_id: selectedPayee?.id,
        description: description.trim(),
        user_id: session.user.id,
      };

      if (editQt) {
        await updateQuickTransaction(qt);
      } else {
        await insertQuickTransaction(qt);
      }

      DeviceEventEmitter.emit('module_refreshed', { module: 'Transactions' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Dashboard' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Budgets' });

      navigation.goBack();
    } catch (error) {
      console.error('Save Quick Transaction Error:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModal = (modalType: 'Category' | 'Payee') => {
    const rawData = modalType === 'Category' ? categories.filter((c) => c.type === type) : payees;
    const displayData =
      modalType === 'Payee'
        ? ([{ id: 'none', name: 'None' }, ...rawData] as any[])
        : (rawData as any[]);
    const filteredData = displayData.filter((item) =>
      item.name.toLowerCase().includes(modalSearch.toLowerCase()),
    );

    const iconColor = type === 'Income' ? colors.success : colors.danger;
    const iconBg = type === 'Income' ? colors.success + '15' : colors.danger + '15';

    return (
      <BottomSheet
        visible={showModal === modalType}
        onClose={() => setShowModal(null)}
        title={`Select ${modalType}`}
      >
        <View style={styles.flex1}>
          <View style={styles.searchContainer}>
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
            keyExtractor={(item) => item.id}
            numColumns={4}
            contentContainerStyle={styles.modalContent}
            renderItem={({ item }: { item: Category | Payee }) => {
              const isSelected =
                (modalType === 'Category' ? selectedCategory?.id : selectedPayee?.id) === item.id;
              return (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => {
                    if (modalType === 'Category') setSelectedCategory(item as Category);
                    else setSelectedPayee(item.id === 'none' ? null : (item as Payee));
                    setShowModal(null);
                    setModalSearch('');
                  }}
                >
                  <View
                    style={[
                      styles.gridIconBox,
                      {
                        backgroundColor: isSelected ? iconColor : iconBg,
                        borderColor: isSelected ? iconColor : colors.border,
                      },
                    ]}
                  >
                    <Icon
                      name={
                        formatIconName(
                          (item as Category).app_icon ||
                            (modalType === 'Category' ? 'category' : 'person'),
                        ) as keyof typeof Icon.glyphMap
                      }
                      size={24}
                      color={isSelected ? 'white' : iconColor}
                    />
                  </View>
                  <Text
                    style={[
                      styles.gridLabel,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
            columnWrapperStyle={common.justifyStart}
            style={styles.modalList}
          />
        </View>
      </BottomSheet>
    );
  };

  const currentIconColor = type === 'Income' ? colors.success : colors.danger;

  return (
    <View style={styles.container}>
      <BottomSheet
        visible={true}
        onClose={() => navigation.goBack()}
        title={editQt ? 'Edit Template' : 'New Template'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={[styles.label, { color: colors.textSecondary }]}>Template Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Morning Coffee"
                placeholderTextColor={colors.textSecondary + '70'}
                value={name}
                onChangeText={setName}
              />

              <SegmentedControl
                options={[
                  { label: 'Expense', value: 'Expense', activeColor: colors.danger },
                  { label: 'Income', value: 'Income', activeColor: colors.success },
                ]}
                selectedValue={type}
                onValueChange={(val: 'Expense' | 'Income') => setType(val)}
                variant="medium"
                containerStyle={styles.segmentedControl}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Default Amount (Optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary + '70'}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <View style={styles.row}>
                <View style={[styles.flex1, { marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.picker,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => setShowModal('Category')}
                  >
                    <Icon
                      name={formatIconName(selectedCategory?.app_icon || 'category') as any}
                      size={20}
                      color={selectedCategory ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.pickerText,
                        { color: selectedCategory ? colors.text : colors.textSecondary },
                      ]}
                    >
                      {selectedCategory?.name || 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.flex1, { marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Payee</Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.picker,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => setShowModal('Payee')}
                  >
                    <Icon
                      name="person"
                      size={20}
                      color={selectedPayee ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.pickerText,
                        { color: selectedPayee ? colors.text : colors.textSecondary },
                      ]}
                    >
                      {selectedPayee?.name || 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Default Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Daily caffeine fix"
                placeholderTextColor={colors.textSecondary + '70'}
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: currentIconColor },
                submitting && styles.submitting,
              ]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>{editQt ? 'Save Changes' : 'Save Template'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
        {renderModal('Category')}
        {renderModal('Payee')}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  searchContainer: { paddingBottom: 16 },
  modalContent: { paddingBottom: 40, paddingHorizontal: 10 },
  modalList: { maxHeight: 400 },
  segmentedControl: { marginTop: 24, marginBottom: 16 },
  submitting: { opacity: 0.7 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  input: { height: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },

  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  gridLabel: { fontSize: 12, fontWeight: '600', maxWidth: '90%', textAlign: 'center' },
});
