import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import FAB from '../../components/FAB';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BudgetModel } from '../../database/budgets/budgetModel';
import { TransactionModel } from '../../database/transactions/transactionModel';
import { syncBudgets } from '../../database/budgets/budgetSync';
import { useNetwork } from '../../hooks/useNetwork';

const BudgetsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isConnected = useNetwork();
  const colors = theme.colors;

  const [budgets, setBudgets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    const rawBudgets = await BudgetModel.getAll(user.id);
    const transactions = await TransactionModel.getAll(user.id);

    // Calculate usage
    // For simplicity, assuming monthly budgets and current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const budgetsWithUsage = rawBudgets.map((b) => {
      const spent = transactions.reduce((acc, t) => {
        const tDate = new Date(t.transaction_timestamp);
        if (
          t.type === 'Expense' &&
          tDate.getMonth() === currentMonth &&
          tDate.getFullYear() === currentYear
        ) {
          // Check category match if budget has specific categories
          // For now, assuming global budget or matching logic
          return acc + t.amount;
        }
        return acc;
      }, 0);

      return { ...b, spent };
    });

    setBudgets(budgetsWithUsage);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      await syncBudgets(user.id);
    }
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const progress = item.amount > 0 ? item.spent / item.amount : 0;
    const isOverBudget = item.spent > item.amount;
    const progressColor = isOverBudget ? colors.error : colors.primary;

    return (
      <Card mode="elevated" onPress={() => navigation.navigate('BudgetForm', { budget: item })}>
        <View style={styles.cardHeader}>
          <Text style={[styles.budgetName, { color: colors.onSurface }]}>{item.name}</Text>
          <Text style={[styles.budgetAmount, { color: colors.onSurface }]}>
            ₹{item.spent.toFixed(0)} / ₹{item.amount.toFixed(0)}
          </Text>
        </View>

        <ProgressBar progress={progress} color={progressColor} style={styles.progressBar} />

        <Text
          style={[
            styles.percentage,
            { color: isOverBudget ? colors.error : colors.onSurfaceVariant },
          ]}
        >
          {(progress * 100).toFixed(1)}% used
        </Text>
      </Card>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Budgets</Text>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              No budgets set
            </Text>
          </View>
        }
      />

      <FAB icon="plus" onPress={() => navigation.navigate('BudgetForm')} />
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
    paddingBottom: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  budgetName: {
    fontSize: 18,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    marginBottom: 8,
  },
  percentage: {
    fontSize: 12,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default BudgetsScreen;
