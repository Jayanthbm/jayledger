import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionModel } from '../../database/transactions/transactionModel';
import { CategoryModel } from '../../database/categories/categoryModel';
import { PayeeModel } from '../../database/payees/payeeModal'; // Typo in filename
import { pushUnsyncedTransactions } from '../../database/transactions/transactionSync';

const TransactionFormScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = theme.colors;
  const { transaction } = route.params || {};

  const [amount, setAmount] = useState(transaction ? transaction.amount.toString() : '');
  const [description, setDescription] = useState(transaction ? transaction.description : '');
  const [type, setType] = useState(transaction ? transaction.type : 'Expense');
  const [categoryId, setCategoryId] = useState(transaction ? transaction.category_id : null);
  const [payeeId, setPayeeId] = useState(transaction ? transaction.payee_id : null);

  const [categories, setCategories] = useState([]);
  const [payees, setPayees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cats = await CategoryModel.getAll(user.id);
    const pays = await PayeeModel.getAll(user.id);
    setCategories(cats);
    setPayees(pays);
  };

  const handleSave = async () => {
    if (!amount || isNaN(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const txData = {
        user_id: user.id,
        amount: parseFloat(amount),
        transaction_timestamp: transaction
          ? transaction.transaction_timestamp
          : new Date().toISOString(),
        description,
        category_id: categoryId,
        payee_id: payeeId,
        type,
      };

      if (transaction) {
        await TransactionModel.update({ ...txData, id: transaction.id });
      } else {
        await TransactionModel.insert(txData);
      }

      // Trigger background sync
      pushUnsyncedTransactions(user.id);

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.onBackground }]}>
        {transaction ? 'Edit Transaction' : 'New Transaction'}
      </Text>

      <View style={styles.typeContainer}>
        <Button
          mode={type === 'Expense' ? 'filled' : 'outlined'}
          onPress={() => setType('Expense')}
          style={{ flex: 1, marginRight: 8 }}
        >
          Expense
        </Button>
        <Button
          mode={type === 'Income' ? 'filled' : 'outlined'}
          onPress={() => setType('Income')}
          style={{ flex: 1, marginLeft: 8 }}
        >
          Income
        </Button>
      </View>

      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0.00"
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What is this for?"
      />

      {/* Simple Category/Payee Selection for now - can be improved with Pickers */}
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            mode={categoryId === cat.id ? 'filled' : 'tonal'}
            onPress={() => setCategoryId(cat.id)}
            style={styles.chip}
            contentStyle={{ paddingHorizontal: 12, minHeight: 32 }}
            labelStyle={{ fontSize: 12 }}
          >
            {cat.name}
          </Button>
        ))}
      </ScrollView>

      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Payee</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {payees.map((pay) => (
          <Button
            key={pay.id}
            mode={payeeId === pay.id ? 'filled' : 'tonal'}
            onPress={() => setPayeeId(pay.id)}
            style={styles.chip}
            contentStyle={{ paddingHorizontal: 12, minHeight: 32 }}
            labelStyle={{ fontSize: 12 }}
          >
            {pay.name}
          </Button>
        ))}
      </ScrollView>

      <Button mode="filled" onPress={handleSave} loading={loading} style={styles.saveButton}>
        Save Transaction
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
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  chipScroll: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
    marginVertical: 0,
    borderRadius: 8,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default TransactionFormScreen;
