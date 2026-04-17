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
  } | null;
  totalAmount: number;
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
  type,
  data,
  searchQuery,
  sortedDataLength,
  colors,
}) => {
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
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>INCOME</Text>
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
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>EXPENSE</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatCurrency(summaryMetrics.expense)}
            </Text>
          </View>
        </View>
        <View
          style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.summaryIconBox, { backgroundColor: colors.primary + '15' }]}>
            <Icon name="account-balance-wallet" size={24} color={colors.primary} />
          </View>
          <View style={styles.summaryTextColumn}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>SAVED</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
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
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL</Text>
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
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
  },
});
