import type { ThemeColors } from '../../models/types';
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';
import { ProgressBar } from '../ProgressBar';

import { formatCurrency } from '../../utils/formatters';

interface DashboardRemainingProps {
  monthIncome: number;
  monthExpense: number;
  colors: ThemeColors;
}

export const DashboardRemainingCard = React.memo(
  ({ monthIncome, monthExpense, colors }: DashboardRemainingProps) => {
    const remaining = monthIncome - monthExpense;
    const spentPercent = Math.min(100, (monthExpense / (monthIncome || 1)) * 100);

    return (
      <DashboardCard
        colors={colors}
        title="REMAINING FOR PERIOD"
        icon="account-balance-wallet"
        isMain={true}
      >
        <Text style={[styles.mainAmount, { color: colors.text }]}>{formatCurrency(remaining)}</Text>
        <ProgressBar
          progress={spentPercent}
          color={colors.primary}
          backgroundColor="rgba(0,0,0,0.05)"
          height={8}
        />
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          {spentPercent.toFixed(0)}% Spent
        </Text>
      </DashboardCard>
    );
  },
);
DashboardRemainingCard.displayName = 'DashboardRemainingCard';

const styles = StyleSheet.create({
  mainAmount: { fontSize: 36, fontWeight: '800', marginBottom: 16 },
  progressLabel: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'right' },
});
