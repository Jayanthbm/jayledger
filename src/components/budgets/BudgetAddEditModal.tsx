import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import { Budget, Category } from '../../models/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';

interface BudgetForm {
  name: string;
  amount: string;
  interval: string;
  categories: string[];
  logo: string;
}

interface BudgetAddEditModalProps {
  visible: boolean;
  onClose: () => void;
  editingBudget: Budget | null;
  allCategories: Category[];
  onSave: (budgetData: any) => Promise<void>;
  onDeleteRequest?: (id: string) => void;
}

export const BudgetAddEditModal: React.FC<BudgetAddEditModalProps> = ({
  visible,
  onClose,
  editingBudget,
  allCategories,
  onSave,
  onDeleteRequest
}) => {
  const { colors } = useTheme();
  const [form, setForm] = useState<BudgetForm>({
    name: '',
    amount: '',
    interval: 'Monthly',
    categories: [],
    logo: 'account-balance-wallet'
  });

  useEffect(() => {
    if (visible) {
      if (editingBudget) {
        setForm({
          name: editingBudget.name,
          amount: editingBudget.amount.toString(),
          interval: editingBudget.interval,
          categories: JSON.parse(editingBudget.categories),
          logo: editingBudget.logo
        });
      } else {
        setForm({
          name: '',
          amount: '',
          interval: 'Monthly',
          categories: [],
          logo: 'account-balance-wallet'
        });
      }
    }
  }, [visible, editingBudget]);

  const handleSave = () => {
    const budgetData = {
      name: form.name,
      amount: parseFloat(form.amount) || 0,
      categories: JSON.stringify(form.categories),
      interval: form.interval,
      logo: form.logo,
      start_date: editingBudget?.start_date || format(new Date(), 'yyyy-MM-dd')
    };
    onSave(budgetData);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editingBudget ? 'Edit Budget' : 'New Budget'}
      headerRight={editingBudget && onDeleteRequest ? (
        <TouchableOpacity onPress={() => onDeleteRequest(editingBudget.id)} style={styles.deleteBtnIcon}>
          <MaterialIcons name="delete" size={24} color={colors.danger} />
        </TouchableOpacity>
      ) : undefined}
    >
      <View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>BUDGET NAME</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
              value={form.name}
              onChangeText={(t) => setForm(f => ({ ...f, name: t }))}
              placeholder="e.g. Monthly Grocery"
              placeholderTextColor={colors.textSecondary + '80'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>MONTHLY AMOUNT</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
              value={form.amount}
              onChangeText={(t) => setForm(f => ({ ...f, amount: t }))}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORIES</Text>
            <View style={styles.categoryGrid}>
              {allCategories.map(cat => {
                const isSelected = form.categories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      const newCats = isSelected ? form.categories.filter(id => id !== cat.id) : [...form.categories, cat.id];
                      setForm(f => ({ ...f, categories: newCats }));
                    }}
                    style={[styles.catChip, {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border
                    }]}
                  >
                    <Text style={[styles.catChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>Save Budget</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  deleteBtnIcon: {
    padding: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    fontSize: 17,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
