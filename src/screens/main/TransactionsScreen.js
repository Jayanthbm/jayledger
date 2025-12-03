import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TransactionItem from '../../components/TransactionItem';
import FAB from '../../components/FAB';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionModel } from '../../database/transactions/transactionModel';
import { CategoryModel } from '../../database/categories/categoryModel';
import { syncTransactions } from '../../database/transactions/transactionSync';
import { useNetwork } from '../../hooks/useNetwork';

const TransactionsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isConnected = useNetwork();
  const colors = theme.colors;

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const cats = await CategoryModel.getAll(user.id);
    const catMap = {};
    cats.forEach((c) => (catMap[c.id] = c));
    setCategories(catMap);

    const txs = await TransactionModel.getAll(user.id);
    setTransactions(txs);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      await syncTransactions(user.id);
    }
    await loadData();
    setRefreshing(false);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Transactions</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={categories[item.category_id]}
            onPress={() => navigation.navigate('TransactionForm', { transaction: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No transactions yet
            </Text>
          </View>
        }
      />

      <FAB icon="plus" onPress={() => navigation.navigate('TransactionForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default TransactionsScreen;
