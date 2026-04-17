import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';

interface DashboardRemainingProps {
  monthIncome: number;
  monthExpense: number;
  colors: any;
}

export const DashboardRemainingCard = React.memo(({ monthIncome, monthExpense, colors }: DashboardRemainingProps) => {
  const remaining = monthIncome - monthExpense;
  const spentPercent = Math.min(100, (monthExpense / (monthIncome || 1)) * 100);

  return (
    <DashboardCard
      colors={colors}
      title="REMAINING FOR PERIOD"
      icon="account-balance-wallet"
      isMain={true}
    >
      <Text style={[styles.mainAmount, { color: colors.text }]}>₹{remaining.toLocaleString()}</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, {
          width: `${spentPercent}%`,
          backgroundColor: colors.primary
        }]} />
      </View>
      <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
        {spentPercent.toFixed(0)}% Spent
      </Text>
    </DashboardCard>
  );
});

const styles = StyleSheet.create({
  mainAmount: { fontSize: 36, fontWeight: '800', marginBottom: 16 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'right' },
});
