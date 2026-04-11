import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionsSummaryByDate } from '../db/queries';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { syncTransactions } from '../services/syncService';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [monthTotal, setMonthTotal] = useState({ income: 0, expense: 0 });

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    const startStr = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endStr = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    
    // Using SQLite aggregation mapping!
    const summary = await getTransactionsSummaryByDate(session.user.id, startStr, endStr);
    
    let inc = 0;
    let exp = 0;
    summary.forEach(row => {
      if (row.type === 'Income') inc += row.amount;
      if (row.type === 'Expense') exp += row.amount;
    });

    setMonthTotal({ income: inc, expense: exp });
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if(session?.user?.id) {
       await syncTransactions(session.user.id);
    }
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>This Month</Text>
        
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.amount, { color: colors.success }]}>+ ₹{monthTotal.income.toLocaleString()}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Expense</Text>
            <Text style={[styles.amount, { color: colors.danger }]}>- ₹{monthTotal.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.metric}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Balance</Text>
          <Text style={[styles.balance, { color: colors.text }]}>₹{(monthTotal.income - monthTotal.expense).toLocaleString()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metric: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  }
});
