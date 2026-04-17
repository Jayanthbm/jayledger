import type { ThemeColors } from '../../models/types';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import Icon from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';

interface ReportSortPickerProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'amount';
  sortAsc: boolean;
  onSortChange: (sortBy: 'name' | 'amount', sortAsc: boolean) => void;
  colors: ThemeColors;
}

export const ReportSortPicker: React.FC<ReportSortPickerProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange,
  colors,
}) => {
  const sortOptions: Array<{ label: string; value: 'name' | 'amount' }> = [
    { label: 'Name', value: 'name' },
    { label: 'Amount', value: 'amount' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort Results">
      <View style={common.mt10}>
        {sortOptions.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[common.pickerItemRowBetweenCompact, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (isActive) {
                  onSortChange(opt.value, !sortAsc);
                } else {
                  onSortChange(opt.value, opt.value === 'name'); // Default Asc for name, Desc for amount
                }
                onClose();
              }}
            >
              <Text style={[common.pickerText, { color: isActive ? colors.primary : colors.text }]}>
                {opt.label}
              </Text>
              {isActive && (
                <Icon
                  name={sortAsc ? 'arrow-upward' : 'arrow-downward'}
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
};
