import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ThemeColors, ReportItem, MaterialIconName } from '../../models/types';
import { common } from '../../styles/common';
import { formatCurrency } from '../../utils/formatters';
import { ProgressBar } from '../ProgressBar';
import { FinancialListItem } from '../common/FinancialListItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ReportListItemProps {
  item: ReportItem;
  type: string;
  totalAmount: number;
  isDark: boolean;
  colors: ThemeColors;
  onPress: () => void;
  showTrends?: boolean;
}

export const ReportListItem: React.FC<ReportListItemProps> = ({
  item,
  type,
  totalAmount,
  isDark,
  colors,
  onPress,
  showTrends = true,
}) => {
  const amount = item.amount || item.totalAmount || 0;
  const progressPercent = (amount / (totalAmount || 1)) * 100;
  const itemType = item.type || type;
  const isIncome = itemType === 'Income';

  const isPayee = !!(item.payee_name || item.payee_id);
  const isGroup = !!(item.group_name || item.group_id);
  const name = item.category_name || item.payee_name || item.group_name || item.name || 'Unknown';

  const diff = item.diffPercentage || 0;
  const hasDiff = item.prevAmount !== undefined;

  let leftNode;
  if (isPayee) {
    if (item.payee_logo) {
      leftNode = (
        <Image
          source={{ uri: item.payee_logo }}
          style={styles.logoImage}
          contentFit="contain"
          transition={200}
          cachePolicy="disk"
        />
      );
    } else {
      leftNode = (
        <View style={styles.avatarContainer}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
  }

  return (
    <FinancialListItem
      title={name}
      subtitle={
        showTrends && hasDiff ? (
          <View style={styles.trendRow}>
            {Math.round(diff) !== 0 && (
              <MaterialIcons
                name={diff >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={
                  diff >= 0
                    ? isIncome
                      ? colors.success
                      : colors.danger
                    : isIncome
                      ? colors.danger
                      : colors.success
                }
              />
            )}
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    Math.round(diff) === 0
                      ? colors.textSecondary
                      : diff >= 0
                        ? isIncome
                          ? colors.success
                          : colors.danger
                        : isIncome
                          ? colors.danger
                          : colors.success,
                },
              ]}
            >
              {Math.round(diff) !== 0 && (item.prevAmount || 0) > 0 ? (
                <>{Math.abs(diff).toFixed(0)}% </>
              ) : null}
              ({formatCurrency(item.prevAmount || 0)})
            </Text>
          </View>
        ) : undefined
      }
      icon={
        (!leftNode
          ? isGroup
            ? 'folder'
            : item.category_app_icon || item.app_icon || 'receipt'
          : undefined) as MaterialIconName
      }
      iconColor={colors.primary}
      leftNode={leftNode}
      amountText={formatCurrency(amount)}
      amountColor={isIncome ? colors.success : colors.danger}
      onPress={onPress}
      containerStyle={styles.reportItemContainer}
    >
      {!isGroup && (
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
      )}
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
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
