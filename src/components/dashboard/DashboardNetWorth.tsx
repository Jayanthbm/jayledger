import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { common } from '../../styles/common';
import { DashboardCard } from './DashboardCard';

interface DashboardNetWorthProps {
  netWorth: number;
  colors: any;
}

export const DashboardNetWorth = React.memo(({ netWorth, colors }: DashboardNetWorthProps) => {
  return (
    <DashboardCard colors={colors} title="NET WORTH" icon="stars" style={common.mb40}>
      <Text
        style={[
          styles.rowValue,
          {
            color: netWorth >= 0 ? colors.success : colors.danger,
            fontSize: 32,
          },
        ]}
      >
        ₹{netWorth.toLocaleString()}
      </Text>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>ALL TIME BALANCE</Text>
    </DashboardCard>
  );
});
DashboardNetWorth.displayName = 'DashboardNetWorth';

const styles = StyleSheet.create({
  rowValue: { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  rowLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
    marginTop: 4,
  },
});
