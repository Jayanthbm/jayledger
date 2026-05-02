import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { common } from '../../styles/common';

interface CategorySortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'priority';
  sortAsc: boolean;
  onSortChange: (mode: 'name' | 'priority', asc: boolean) => void;
}

export const CategorySortModal: React.FC<CategorySortModalProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange,
}) => {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Sort Categories">
      <View style={common.mt10}>
        {(['name', 'priority'] as const).map((mode) => {
          const isActive = sortBy === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[common.pickerItemRowBetween, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (isActive) {
                  onSortChange(mode, !sortAsc);
                } else {
                  // Default Asc for both
                  onSortChange(mode, true);
                }
                onClose();
              }}
            >
              <Text
                style={[common.pickerTextSemi, { color: isActive ? colors.primary : colors.text }]}
              >
                {mode === 'priority' ? 'Priority' : 'Name'}
              </Text>
              {isActive && (
                <MaterialIcons
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
CategorySortModal.displayName = 'CategorySortModal';
