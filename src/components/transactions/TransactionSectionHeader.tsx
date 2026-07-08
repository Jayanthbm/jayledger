import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface TransactionSectionHeaderProps {
  date: string;
  total: number;
  colors: ThemeColors;
}

export const TransactionSectionHeader = React.memo(
  ({ date, total, colors }: TransactionSectionHeaderProps) => (
    <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
        {formatDate(date, 'MMM dd, yyyy')}
      </Text>
      <Text style={[styles.headerTotal, { color: total >= 0 ? colors.success : colors.danger }]}>
        {total >= 0 ? '+' : ''}
        {formatCurrency(total)}
      </Text>
    </View>
  ),
);
TransactionSectionHeader.displayName = 'TransactionSectionHeader';

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerDate: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTotal: {
    fontSize: 13,
    fontWeight: '800',
  },
});
