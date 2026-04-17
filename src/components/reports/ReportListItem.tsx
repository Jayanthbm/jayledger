import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { MaterialIconName, ThemeColors, ReportItem } from '../../models/types';
import { common } from '../../styles/common';

import { ProgressBar } from '../ProgressBar';

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
  const progressPercent = ((item.amount || item.totalAmount || 0) / (totalAmount || 1)) * 100;

  return (
    <TouchableOpacity
      style={[styles.reportItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.itemRow}>
        <View style={styles.itemMain}>
          {(item.category_app_icon || item.app_icon) && (
            <Icon
              name={(item.category_app_icon || item.app_icon) as MaterialIconName}
              size={24}
              color={colors.primary}
              style={common.mr12}
            />
          )}
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.category_name || item.payee_name || item.name || item.type}
          </Text>
        </View>
        <Text
          style={[
            styles.itemAmount,
            { color: (item.type || type) === 'Income' ? colors.success : colors.danger },
          ]}
        >
          ₹{(item.amount || item.totalAmount || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressPercent}
          color={(item.type || type) === 'Income' ? colors.success : colors.danger}
          backgroundColor={isDark ? '#333' : '#eee'}
          height={6}
          style={common.flex1}
        />
        <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>
          {progressPercent.toFixed(0)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};
ReportListItem.displayName = 'ReportListItem';

const styles = StyleSheet.create({
  reportItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressPercent: { fontSize: 12, fontWeight: '600', width: 35 },
});
