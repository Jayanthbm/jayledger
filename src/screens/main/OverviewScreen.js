import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/Card';
import TransactionItem from '../../components/TransactionItem';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionModel } from '../../database/transactions/transactionModel';
import { CategoryModel } from '../../database/categories/categoryModel';
import { syncTransactions } from '../../database/transactions/transactionSync';
import { useNetwork } from '../../hooks/useNetwork';

const OverviewScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isConnected = useNetwork();
  const colors = theme.colors;

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  const loadData = async () => {
    if (!user) return;

    // Load Categories for icons
    const cats = await CategoryModel.getAll(user.id);
    const catMap = {};
    cats.forEach((c) => (catMap[c.id] = c));
    setCategories(catMap);

    // Load Transactions
    const txs = await TransactionModel.getAll(user.id);
    setTransactions(txs);

    // Calculate Summary
    let inc = 0,
      exp = 0;
    txs.forEach((t) => {
      if (t.type === 'Income') inc += t.amount;
      else exp += t.amount;
    });
    setSummary({ income: inc, expense: exp, balance: inc - exp });
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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.header, { color: colors.onBackground }]}>Overview</Text>

      {/* Summary Card */}
      <Card mode="elevated" style={styles.summaryCard}>
        <Text style={[styles.balanceLabel, { color: colors.onSurfaceVariant }]}>Total Balance</Text>
        <Text style={[styles.balanceValue, { color: colors.primary }]}>
          ₹{summary.balance.toFixed(2)}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Income</Text>
            <Text style={[styles.statValue, { color: colors.income }]}>
              +₹{summary.income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Expense</Text>
            <Text style={[styles.statValue, { color: colors.expense }]}>
              -₹{summary.expense.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
          Recent Transactions
        </Text>
        <Text
          style={[styles.seeAll, { color: colors.primary }]}
          onPress={() => navigation.navigate('Transactions')}
        >
          See All
        </Text>
      </View>

      {transactions.slice(0, 5).map((t) => (
        <TransactionItem
          key={t.id}
          transaction={t}
          category={categories[t.category_id]}
          onPress={() => {}}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OverviewScreen;
