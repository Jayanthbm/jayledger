import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionsByCategoryForExpense } from '../db/queries';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  
  const [currentMonthData, setCurrentMonthData] = useState<any[]>([]);
  const [previousMonthData, setPreviousMonthData] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    const now = new Date();
    const currStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const currEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    
    const prevTime = subMonths(now, 1);
    const prevStart = format(startOfMonth(prevTime), 'yyyy-MM-dd');
    const prevEnd = format(endOfMonth(prevTime), 'yyyy-MM-dd');

    const curr = await getTransactionsByCategoryForExpense(session.user.id, currStart, currEnd);
    const prev = await getTransactionsByCategoryForExpense(session.user.id, prevStart, prevEnd);

    setCurrentMonthData(curr);
    setPreviousMonthData(prev);
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderTable = (data: any[], title: string) => (
    <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.tableTitle, { color: colors.text }]}>{title}</Text>
      {data.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No data available</Text>
      ) : (
        data.map((item, idx) => (
          <View key={idx} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cellCat, { color: colors.text }]}>{item.category_icon || '•'} {item.category_name}</Text>
            <Text style={[styles.cellAmt, { color: colors.danger }]}>₹{item.totalAmount.toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.textSecondary }]}>Expenses by Category</Text>
      {renderTable(currentMonthData, 'This Month')}
      {renderTable(previousMonthData, 'Previous Month')}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cellCat: {
    fontSize: 14,
    flex: 1,
  },
  cellAmt: {
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  }
});
