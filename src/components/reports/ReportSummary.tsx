import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { ThemeColors, ReportItem } from '../../models/types';
import { formatCurrency } from '../../utils/formatters';

interface ReportSummaryProps {
  isSummary: boolean;
  summaryMetrics: {
    income: number;
    expense: number;
    saved?: number;
    spentPercent?: number;
    prevIncome?: number;
    prevExpense?: number;
    prevSaved?: number;
    incomeDiff?: number;
    expenseDiff?: number;
    savedDiff?: number;
  } | null;
  totalAmount: number;
  totalDiff?: number;
  prevTotal?: number;
  showTrends?: boolean;
  type: string;
  data: ReportItem[];
  searchQuery: string;
  sortedDataLength: number;
  colors: ThemeColors;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  isSummary,
  summaryMetrics,
  totalAmount,
  totalDiff = 0,
  prevTotal = 0,
  showTrends = true,
  type,
  data,
  searchQuery,
  sortedDataLength,
  colors,
}) => {
  const renderTrend = (diff: number, isIncome: boolean, prevVal?: number) => {
    const isNeutral = Math.round(diff) === 0;

    // For Monthly/Yearly summaries, we don't show "Same" trends to keep the grid clean
    if (isSummary && isNeutral) return null;

    // Determine color
    const color = isNeutral
      ? colors.textSecondary
      : diff >= 0
        ? isIncome
          ? colors.success
          : colors.danger
        : isIncome
          ? colors.danger
          : colors.success;

    const icon = isNeutral ? null : diff >= 0 ? 'trending-up' : 'trending-down';

    return (
      <View style={styles.trendRow}>
        {icon && <Icon name={icon} size={14} color={color} />}
        <Text style={[styles.trendText, { color }]}>
          {!isNeutral && (prevVal || 0) > 0 ? `${Math.abs(diff).toFixed(0)}%` : ''}
          {!isSummary && (prevVal || 0) > 0 && ` (${formatCurrency(prevVal || 0)})`}
        </Text>
      </View>
    );
  };

  if (isSummary && summaryMetrics) {
    return (
      <View style={styles.summaryGrid}>
        <View
          style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.summaryIconBox, { backgroundColor: colors.success + '15' }]}>
            <Icon name="trending-up" size={24} color={colors.success} />
          </View>
          <View style={styles.summaryTextColumn}>
            <View style={styles.labelRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>INCOME</Text>
              {renderTrend(summaryMetrics.incomeDiff || 0, true, summaryMetrics.prevIncome)}
            </View>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(summaryMetrics.income)}
            </Text>
          </View>
        </View>
        <View
          style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.summaryIconBox, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="trending-down" size={24} color={colors.danger} />
          </View>
          <View style={styles.summaryTextColumn}>
            <View style={styles.labelRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
              {renderTrend(summaryMetrics.expenseDiff || 0, false, summaryMetrics.prevExpense)}
            </View>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatCurrency(summaryMetrics.expense)}
            </Text>
          </View>
        </View>
        <View
          style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View
            style={[
              styles.summaryIconBox,
              {
                backgroundColor:
                  (summaryMetrics.saved || 0) >= 0 ? colors.primary + '15' : colors.danger + '15',
              },
            ]}
          >
            <Icon
              name={(summaryMetrics.saved || 0) >= 0 ? 'account-balance-wallet' : 'warning'}
              size={24}
              color={(summaryMetrics.saved || 0) >= 0 ? colors.primary : colors.danger}
            />
          </View>
          <View style={styles.summaryTextColumn}>
            <View style={styles.labelRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {(summaryMetrics.saved || 0) >= 0 ? 'SAVED' : 'DEFICIT'}
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                { color: (summaryMetrics.saved || 0) >= 0 ? colors.primary : colors.danger },
              ]}
            >
              {formatCurrency(summaryMetrics.saved || 0)}
            </Text>
          </View>
        </View>
        <View
          style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.summaryIconBox, { backgroundColor: colors.textSecondary + '15' }]}>
            <Icon name="pie-chart" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.summaryTextColumn}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>SPENT</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {String(summaryMetrics.spentPercent?.toFixed(1) || '0.0')}%
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!searchQuery.trim() || sortedDataLength > 0) {
    return (
      <View style={styles.summaryBanner}>
        <View style={styles.totalRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL</Text>
          {showTrends && renderTrend(totalDiff, (data[0]?.type || type) === 'Income', prevTotal)}
        </View>
        <Text
          style={[
            styles.summaryAmount,
            { color: (data[0]?.type || type) === 'Income' ? colors.success : colors.danger },
          ]}
        >
          {formatCurrency(totalAmount)}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  summaryBanner: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    opacity: 0.7,
  },
  summaryAmount: { fontSize: 36, fontWeight: '800' },
  summaryGrid: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  summaryBox: {
    width: '100%',
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  summaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextColumn: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
});
