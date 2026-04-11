import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { syncBudgets } from '../services/syncService';
import { Budget } from '../models/types';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  
  const [data, setData] = useState<Budget[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    const db = getDb();
    let rows = await db.getAllAsync<Budget>(
      `SELECT * FROM budgets WHERE user_id = '${session.user.id}' ORDER BY name ASC`
    );
    if (rows.length === 0) {
      await syncBudgets(session.user.id);
      rows = await db.getAllAsync<Budget>(
        `SELECT * FROM budgets WHERE user_id = '${session.user.id}' ORDER BY name ASC`
      );
    }
    setData(rows);
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if(session?.user?.id) await syncBudgets(session.user.id);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Budget }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]}>{item.logo || '📊'} {item.name}</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>₹{item.amount.toLocaleString()}</Text>
        </View>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Interval: {item.interval}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', margin: 20, color: colors.textSecondary }}>No budgets found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sub: {
    fontSize: 12,
  }
});
