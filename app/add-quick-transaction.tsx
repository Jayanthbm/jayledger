import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import { triggerSuccess } from '@/utils/haptics';
import {
  getCategories,
  getPayees,
  insertQuickTransaction,
  updateQuickTransaction,
} from '@/db/queries';
import { BottomSheet } from '@/components/BottomSheet';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Category, Payee, QuickTransaction } from '@/models/types';
import { generateUUID } from '@/utils/commonUtils';
import { validateAmount } from '@/utils/validators';
import { TransactionFormFields } from '@/components/transactions/TransactionFormFields';
import { TransactionSelectorRow } from '@/components/transactions/TransactionSelectorRow';
import { ItemSelectorModal } from '@/components/transactions/ItemSelectorModal';
import { logger } from '@/utils/logger';

export default function AddQuickTransactionScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ quickTransaction?: string }>();
  const editQt = React.useMemo(
    () =>
      params.quickTransaction
        ? (JSON.parse(params.quickTransaction) as QuickTransaction)
        : undefined,
    [params.quickTransaction],
  );
  const { showToast } = useToast();

  const [name, setName] = useState(editQt?.name || '');
  const [type, setType] = useState<'Income' | 'Expense'>(
    (editQt?.type as 'Income' | 'Expense') || 'Expense',
  );
  const [amount, setAmount] = useState(editQt?.amount ? editQt.amount.toString() : '');
  const [description, setDescription] = useState(editQt?.description || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [productLink, setProductLink] = useState(editQt?.product_link || '');
  const [identifier, setIdentifier] = useState(editQt?.identifier || '');

  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [showModal, setShowModal] = useState<'Category' | 'Payee' | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [payeeSearch, setPayeeSearch] = useState('');
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

    if (amount) {
      const amountValidation = validateAmount(amount);
      if (!amountValidation.valid) {
        showToast(amountValidation.errors.amount || 'Invalid amount', 'error');
        return;
      }
    }

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
        product_link: productLink.trim() || null,
        priority: editQt?.priority || 0,
        identifier: identifier.trim().toUpperCase().slice(0, 2) || undefined,
      };

      if (editQt) {
        await updateQuickTransaction(qt);
      } else {
        await insertQuickTransaction(qt);
      }

      triggerSuccess();

      DeviceEventEmitter.emit('module_refreshed', { module: 'Transactions' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Dashboard' });
      DeviceEventEmitter.emit('module_refreshed', { module: 'Budgets' });

      navigation.goBack();
    } catch (error) {
      logger.error('Save Quick Transaction Error:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentIconColor = type === 'Income' ? colors.success : colors.danger;
  const currentIconBg = type === 'Income' ? colors.success + '20' : colors.danger + '20';

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

              <TransactionSelectorRow
                selectedPayee={selectedPayee}
                selectedCategory={selectedCategory}
                onPressPayee={() => setShowModal('Payee')}
                onPressCategory={() => setShowModal('Category')}
                colors={colors}
                currentIconBg={currentIconBg}
                currentIconColor={currentIconColor}
              />

              <TransactionFormFields
                amount={amount}
                setAmount={setAmount}
                description={description}
                setDescription={setDescription}
                productLink={productLink}
                setProductLink={setProductLink}
                identifier={identifier}
                setIdentifier={setIdentifier}
                iconColor={currentIconColor}
                colors={colors}
                autoFocus={false}
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
      </BottomSheet>

      <ItemSelectorModal
        visible={showModal === 'Category'}
        onClose={() => setShowModal(null)}
        type="Category"
        data={categories.filter((c) => c.type === type)}
        searchQuery={categorySearch}
        onSearchChange={setCategorySearch}
        selectedItemId={selectedCategory?.id}
        onSelect={(item) => {
          setSelectedCategory(item as Category);
          setShowModal(null);
        }}
        transactionType={type}
      />
      <ItemSelectorModal
        visible={showModal === 'Payee'}
        onClose={() => setShowModal(null)}
        type="Payee"
        data={[{ id: 'none', name: 'None' }, ...payees] as (Category | Payee)[]}
        searchQuery={payeeSearch}
        onSearchChange={setPayeeSearch}
        selectedItemId={selectedPayee?.id}
        onSelect={(item) => {
          setSelectedPayee(item.id === 'none' ? null : (item as Payee));
          setShowModal(null);
        }}
        transactionType={type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
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
});
