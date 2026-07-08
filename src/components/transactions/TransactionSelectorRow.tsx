import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Category, Payee, TransactionGroup, MaterialIconName } from '../../models/types';
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
  selectedGroup?: TransactionGroup | null;
  onPressPayee: () => void;
  onPressCategory: () => void;
  onPressGroup?: () => void;
  colors: Record<string, string>;
  currentIconBg: string;
  currentIconColor: string;
}

export const TransactionSelectorRow = ({
  selectedPayee,
  selectedCategory,
  selectedGroup,
  onPressPayee,
  onPressCategory,
  onPressGroup,
  colors,
  currentIconBg,
  currentIconColor,
}: TransactionSelectorRowProps) => {
  return (
    <View style={styles.selectorRow}>
      {/* Payee */}
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
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            Payee
          </Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {selectedPayee?.name || 'Select'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Category */}
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
          <Text style={[styles.selectorLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            Category
          </Text>
          <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
            {selectedCategory?.name || 'Select'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Group */}
      {onPressGroup && (
        <TouchableOpacity
          style={[
            styles.selectorBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={onPressGroup}
        >
          <View style={[styles.selectorIconBg, { backgroundColor: colors.card }]}>
            <Icon name="folder-open" size={18} color={colors.textSecondary} />
          </View>
          <View style={common.flex1}>
            <Text style={[styles.selectorLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              Group
            </Text>
            <Text style={[styles.selectorValue, { color: colors.text }]} numberOfLines={1}>
              {selectedGroup?.name || 'None'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  selectorIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
