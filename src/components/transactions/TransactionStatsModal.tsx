import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { common } from '../../styles/common';
import type { MonthlyStatsBreakdown } from '../../models/types';

import { formatCurrency } from '../../utils/formatters';

interface TransactionStatsModalProps {
  visible: boolean;
  onClose: () => void;
  statsBreakdown: MonthlyStatsBreakdown[];
  loadingStats: boolean;
  colors: ThemeColors;
}

export const TransactionStatsModal = React.memo(
  ({ visible, onClose, statsBreakdown, loadingStats, colors }: TransactionStatsModalProps) => (
    <BottomSheet visible={visible} onClose={onClose} title="Last 5 Months">
      {loadingStats ? (
        <ActivityIndicator size="large" color={colors.primary} style={common.mt40} />
      ) : (
        <ScrollView>
          {statsBreakdown.map((s, idx) => (
            <View
              key={s.month}
              style={[
                styles.statItem,
                styles.statItemBordered,
                idx === statsBreakdown.length - 1 && styles.statItemLast,
                { borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statMonth, { color: colors.text }]}>{s.month}</Text>
              <View style={common.alignEnd}>
                <Text
                  style={[
                    styles.statsValue,
                    styles.statsValueLarge,
                    {
                      color: s.income - s.expense >= 0 ? colors.success : colors.danger,
                    },
                  ]}
                >
                  {s.income - s.expense >= 0 ? '+' : ''}
                  {formatCurrency(s.income - s.expense)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  ),
);
TransactionStatsModal.displayName = 'TransactionStatsModal';

const styles = StyleSheet.create({
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statItemBordered: {
    borderBottomWidth: 1,
  },
  statItemLast: {
    borderBottomWidth: 0,
  },
  statMonth: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsValueLarge: {
    fontSize: 18,
  },
});
