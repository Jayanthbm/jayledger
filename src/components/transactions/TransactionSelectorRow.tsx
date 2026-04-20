import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Category, Payee, MaterialIconName } from '../../models/types';
import { common } from '../../styles/common';

const formatIconName = (name: string) => {
  if (!name) return 'category';
  let formatted = name.trim();
  if (formatted.startsWith('Md')) {
    formatted = formatted.substring(2);
    formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  return formatted;
};

export interface TransactionSelectorRowProps {
  selectedPayee: Payee | null;
  selectedCategory: Category | null;
  onPressPayee: () => void;
  onPressCategory: () => void;
  colors: Record<string, string>;
  currentIconBg: string;
  currentIconColor: string;
}

export const TransactionSelectorRow = ({
  selectedPayee,
  selectedCategory,
  onPressPayee,
  onPressCategory,
  colors,
  currentIconBg,
  currentIconColor,
}: TransactionSelectorRowProps) => {
  return (
    <View style={styles.selectorRow}>
      <TouchableOpacity
        style={[
          styles.selectorBtn,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={onPressPayee}
      >
        <View style={[styles.selectorIconBg, { backgroundColor: colors.card }]}>
          <Icon name="person-outline" size={18} color={colors.textSecondary} />
        </View>
        <View style={common.flex1}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Payee</Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {selectedPayee?.name || 'Select'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.selectorBtn,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
        onPress={onPressCategory}
      >
        <View style={[styles.selectorIconBg, { backgroundColor: currentIconBg }]}>
          <Icon
            name={
              formatIconName(
                selectedCategory?.app_icon || selectedCategory?.icon || 'grid-view',
              ) as MaterialIconName
            }
            size={18}
            color={currentIconColor}
          />
        </View>
        <View style={common.flex1}>
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]}>Category</Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {selectedCategory?.name || 'Select'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  selectorIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
