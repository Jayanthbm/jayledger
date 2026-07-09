import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getTransactionsByDate } from '../db/queries';
import { Transaction } from '../models/types';
import { TransactionCard } from '../components/TransactionCard';
import { format } from 'date-fns';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { formatCurrency } from '../utils/formatters';
import { logger } from '../utils/logger';

export default function DailyLimitDetailScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const loadData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const txs = await getTransactionsByDate(session.user.id, todayStr);
      setData(txs);
    } catch (error) {
      logger.error("Error loading today's transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [session, todayStr]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const totalSpent = data.reduce((sum, tx) => sum + (tx.type === 'Expense' ? tx.amount : 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Spent Today</Text>
        <Text style={[styles.statsValue, { color: colors.danger }]}>
          {formatCurrency(totalSpent)}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt" size={64} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No transactions today
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  statsCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  loader: {
    marginTop: 40,
  },
});
