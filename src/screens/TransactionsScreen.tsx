import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { getDb } from '../db/database';
import { syncTransactions } from '../services/syncService';
import { Transaction } from '../models/types';
import Icon from '@expo/vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const navigation = useNavigation<any>();

  const [refreshing, setRefreshing] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [sections, setSections] = useState<{ title: string, data: Transaction[] }[]>([]);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    const db = getDb();
    const rows = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE user_id = '${session.user.id}' ORDER BY date DESC, transaction_timestamp DESC`
    );

    // Grouping by date natively in JS after querying sorted list
    const grouped = rows.reduce((acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const formattedSections = Object.entries(grouped).map(([date, data]) => ({
      title: format(new Date(date), 'MMM dd, yyyy'),
      data,
    }));

    setSections(formattedSections);
  }, [session?.user?.id]);

  const forceSync = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsForceSyncing(true);
    try {
      const db = getDb();
      await db.execAsync(`DELETE FROM transactions WHERE user_id = '${session.user.id}'`);
      await syncTransactions(session.user.id);
      await loadData();
    } finally {
      setIsForceSyncing(false);
    }
  }, [session?.user?.id, loadData]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={forceSync}
            style={{ marginRight: 16 }}
            disabled={isForceSyncing}
          >
            {isForceSyncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="sync" size={24} color={colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 16 }}
          >
            <Icon name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, colors, forceSync, isForceSyncing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    if(session?.user?.id) await syncTransactions(session.user.id);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'Income';
    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          {item.category_app_icon ? (
            <Icon name={item.category_app_icon as any} size={24} color={isIncome ? colors.success : colors.primary} />
          ) : (
            <Icon name="receipt" size={24} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.details}>
          <Text style={[styles.desc, { color: colors.text }]}>{item.description || item.category_name}</Text>
          <Text style={[styles.cat, { color: colors.textSecondary }]}>{item.payee_name || item.category_name}</Text>
        </View>
        <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text }]}>
          {isIncome ? '+' : '-'} ₹{item.amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.header, { backgroundColor: colors.background, color: colors.textSecondary }]}>
            {title}
          </Text>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  desc: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cat: {
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
