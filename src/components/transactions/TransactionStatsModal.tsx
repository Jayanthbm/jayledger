import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { common } from '../../styles/common';

interface TransactionStatsModalProps {
  visible: boolean;
  onClose: () => void;
  statsBreakdown: any[];
  loadingStats: boolean;
  colors: any;
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
                {
                  borderBottomWidth: idx === statsBreakdown.length - 1 ? 0 : 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statMonth, { color: colors.text }]}>{s.month}</Text>
              <View style={common.alignEnd}>
                <Text
                  style={[
                    styles.statsValue,
                    {
                      color: s.income - s.expense >= 0 ? colors.success : colors.danger,
                      fontSize: 18,
                    },
                  ]}
                >
                  {s.income - s.expense >= 0 ? '+' : ''}₹{(s.income - s.expense).toLocaleString()}
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
  statMonth: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
