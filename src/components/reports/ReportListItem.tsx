import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, ReportItem } from '../../models/types';
import { common } from '../../styles/common';
import { formatCurrency } from '../../utils/formatters';
import { ProgressBar } from '../ProgressBar';
import { FinancialListItem } from '../common/FinancialListItem';

interface ReportListItemProps {
  item: ReportItem;
  type: string;
  totalAmount: number;
  isDark: boolean;
  colors: ThemeColors;
  onPress: () => void;
}

export const ReportListItem: React.FC<ReportListItemProps> = ({
  item,
  type,
  totalAmount,
  isDark,
  colors,
  onPress,
}) => {
  const amount = item.amount || item.totalAmount || 0;
  const progressPercent = (amount / (totalAmount || 1)) * 100;
  const itemType = item.type || type;
  const isIncome = itemType === 'Income';

  return (
    <FinancialListItem
      title={item.category_name || item.payee_name || item.name || item.type || 'Unknown'}
      icon={(item.category_app_icon || item.app_icon) as any}
      iconColor={colors.primary}
      amountText={formatCurrency(amount)}
      amountColor={isIncome ? colors.success : colors.danger}
      onPress={onPress}
      containerStyle={styles.reportItemContainer}
    >
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressPercent}
          color={isIncome ? colors.success : colors.danger}
          backgroundColor={isDark ? '#333' : '#eee'}
          height={6}
          style={common.flex1}
        />
        <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
          {progressPercent.toFixed(0)}%
        </Text>
      </View>
    </FinancialListItem>
  );
};

ReportListItem.displayName = 'ReportListItem';

const styles = StyleSheet.create({
  reportItemContainer: {
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    width: 35,
  },
});
