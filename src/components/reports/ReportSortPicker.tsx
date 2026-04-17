import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ActionModal } from '../common/ActionModal';
import Icon from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';
import { useTheme } from '../../store/ThemeContext';

interface ReportSortPickerProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'amount';
  sortAsc: boolean;
  onSortChange: (sortBy: 'name' | 'amount', sortAsc: boolean) => void;
}

export const ReportSortPicker: React.FC<ReportSortPickerProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange,
}) => {
  const { colors } = useTheme();
  const sortOptions: Array<{ label: string; value: 'name' | 'amount' }> = [
    { label: 'Name', value: 'name' },
    { label: 'Amount', value: 'amount' },
  ];

  return (
    <ActionModal visible={visible} onClose={onClose} title="Sort Results" icon="sort">
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
                  onSortChange(opt.value, opt.value === 'name');
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
    </ActionModal>
  );
};
