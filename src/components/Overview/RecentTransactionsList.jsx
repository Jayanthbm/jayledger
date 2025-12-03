import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../core/Text';
import TransactionCard from '../app/TransactionCard';
import { useTheme } from '../../context/ThemeContext';

const RecentTransactionsList = ({ transactions, categoryMap, payeeMap }) => {
  const { theme } = useTheme();

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        Recent Transactions
      </Text>
      <View style={styles.list}>
        {transactions.map((t) => (
          <TransactionCard
            key={t.id}
            transaction={t}
            category={categoryMap[t.category_id]}
            payee={payeeMap[t.payee_id]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    paddingHorizontal: 4,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
});

export default RecentTransactionsList;
