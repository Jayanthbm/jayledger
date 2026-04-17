import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { DashboardCard } from './DashboardCard';

interface DashboardNetWorthProps {
  netWorth: number;
  colors: any;
}

export const DashboardNetWorth = React.memo(({ netWorth, colors }: DashboardNetWorthProps) => {
  return (
    <DashboardCard
      colors={colors}
      title="NET WORTH"
      icon="stars"
      style={{ marginBottom: 40 }}
    >
      <Text style={[styles.rowValue, { color: netWorth >= 0 ? colors.success : colors.danger, fontSize: 32, textAlign: 'center' }]}>
        ₹{netWorth.toLocaleString()}
      </Text>
      <Text style={[styles.rowLabel, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>ALL TIME BALANCE</Text>
    </DashboardCard>
  );
});

const styles = StyleSheet.create({
  rowValue: { fontSize: 20, fontWeight: '800' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
});
