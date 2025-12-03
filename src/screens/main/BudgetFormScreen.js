import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BudgetModel } from '../../database/budgets/budgetModel';
import { syncBudgets } from '../../database/budgets/budgetSync';

const BudgetFormScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = theme.colors;
  const { budget } = route.params || {};

  const [name, setName] = useState(budget ? budget.name : '');
  const [amount, setAmount] = useState(budget ? budget.amount.toString() : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const budgetData = {
        user_id: user.id,
        name,
        amount: parseFloat(amount),
        interval: 'Month', // Default to Monthly for now
        start_date: new Date().toISOString(),
        categoires: '', // All categories for now, or implement picker
      };

      if (budget) {
        await BudgetModel.update({ ...budgetData, id: budget.id });
      } else {
        await BudgetModel.insert(budgetData);
      }

      // Trigger sync if needed, or rely on background sync
      // syncBudgets(user.id);

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.onBackground }]}>
        {budget ? 'Edit Budget' : 'New Budget'}
      </Text>

      <Input label="Budget Name" value={name} onChangeText={setName} placeholder="e.g. Groceries" />

      <Input
        label="Limit Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0.00"
      />

      <Button mode="filled" onPress={handleSave} loading={loading} style={styles.saveButton}>
        Save Budget
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default BudgetFormScreen;
