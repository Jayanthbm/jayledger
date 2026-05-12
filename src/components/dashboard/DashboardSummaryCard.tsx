import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DashboardCard } from './DashboardCard';

import { CircularProgress } from '../CircularProgress';

import { formatCurrency } from '../../utils/formatters';

interface DashboardSummaryCardProps {
  title: string;
  subtitle: string;
  income: number;
  expense: number;
  prevIncome?: number;
  prevExpense?: number;
  onPress: () => void;
  colors: ThemeColors;
}

export const DashboardSummaryCard = React.memo(
  ({
    title,
    subtitle,
    income,
    expense,
    prevIncome,
    prevExpense,
    onPress,
    colors,
  }: DashboardSummaryCardProps) => {
    const renderTrend = (current: number, previous: number | undefined, isIncome: boolean) => {
      if (previous === undefined || previous === 0) return null;
      const diff = current - previous;
      const percent = Math.abs((diff / previous) * 100).toFixed(0);
      const isIncrease = diff > 0;

      let color = colors.textSecondary;
      if (isIncome) {
        color = isIncrease ? colors.success : colors.danger;
      } else {
        color = isIncrease ? colors.danger : colors.success;
      }

      return (
        <Text style={[styles.trendText, { color }]}>
          {isIncrease ? '↑' : '↓'}
          {percent}%
        </Text>
      );
    };

    const usedPercent = Math.min(100, (expense / (income || 1)) * 100);

    return (
      <DashboardCard
        colors={colors}
        title={title}
        subtitle={subtitle}
        icon={title === 'THIS YEAR' ? 'event-note' : 'calendar-today'}
        onPress={onPress}
        headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
      >
        <View style={styles.rowBetween}>
          <View style={styles.flex1}>
            <View style={styles.sectionMargin}>
              <View style={styles.trendRow}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
                {renderTrend(expense, prevExpense, false)}
              </View>
              <Text style={[styles.rowValue, { color: colors.danger }]}>
                {formatCurrency(expense)}
              </Text>
            </View>
            <View>
              <View style={styles.trendRow}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>INCOME</Text>
                {renderTrend(income, prevIncome, true)}
              </View>
              <Text style={[styles.rowValue, { color: colors.success }]}>
                {formatCurrency(income)}
              </Text>
            </View>
          </View>

          <View style={styles.circularContainer}>
            <CircularProgress
              percentage={usedPercent}
              progressColor={colors.danger}
              borderColor={colors.border}
              value={`${usedPercent.toFixed(0)}%`}
              label="USED"
              textColor={colors.text}
              fontSize={16}
            />
          </View>
        </View>
      </DashboardCard>
    );
  },
);
DashboardSummaryCard.displayName = 'DashboardSummaryCard';

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rowValue: { fontSize: 20, fontWeight: '800' },
  circularContainer: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
  trendText: { fontSize: 10, fontWeight: '700' },
  flex1: { flex: 1 },
  sectionMargin: { marginBottom: 16 },
  trendRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
