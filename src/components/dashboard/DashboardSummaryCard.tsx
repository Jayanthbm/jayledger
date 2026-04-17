import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DashboardCard } from './DashboardCard';

interface DashboardSummaryCardProps {
  title: string;
  subtitle: string;
  income: number;
  expense: number;
  prevIncome?: number;
  prevExpense?: number;
  onPress: () => void;
  colors: any;
}

export const DashboardSummaryCard = React.memo(({
  title,
  subtitle,
  income,
  expense,
  prevIncome,
  prevExpense,
  onPress,
  colors
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
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>
        {isIncrease ? '↑' : '↓'}{percent}%
      </Text>
    );
  };

  const usedPercent = Math.min(100, (expense / (income || 1)) * 100);

  return (
    <DashboardCard
      colors={colors}
      title={title}
      subtitle={subtitle}
      icon={title === 'THIS YEAR' ? "event-note" : "calendar-today"}
      onPress={onPress}
      headerRight={<MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              {renderTrend(expense, prevExpense, false)}
            </View>
            <Text style={[styles.rowValue, { color: colors.danger }]}>₹{expense.toLocaleString()}</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>INCOME</Text>
              {renderTrend(income, prevIncome, true)}
            </View>
            <Text style={[styles.rowValue, { color: colors.success }]}>₹{income.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.circularContainer}>
          <View style={[styles.progressCircle, {
            borderColor: colors.border,
            borderTopColor: colors.danger,
            borderRightColor: (expense / (income || 1)) > 0.25 ? colors.danger : colors.border,
            borderBottomColor: (expense / (income || 1)) > 0.5 ? colors.danger : colors.border,
            borderLeftColor: (expense / (income || 1)) > 0.75 ? colors.danger : colors.border,
          }]}>
            <View style={[styles.progressInner, { backgroundColor: colors.danger + '05' }]}>
              <Text style={[styles.progressText, { color: colors.text, fontSize: 16 }]}>
                {usedPercent.toFixed(0)}%
              </Text>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>USED</Text>
            </View>
          </View>
        </View>
      </View>
    </DashboardCard>
  );
});

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rowValue: { fontSize: 20, fontWeight: '800' },
  circularContainer: { marginLeft: 16, alignItems: 'center', justifyContent: 'center' },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: { fontSize: 20, fontWeight: '800' },
  progressSub: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
});
