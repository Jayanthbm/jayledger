import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface BudgetSortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'amount' | 'spent' | 'remaining';
  sortAsc: boolean;
  onSortChange: (mode: 'name' | 'amount' | 'spent' | 'remaining', asc: boolean) => void;
}

export const BudgetSortModal: React.FC<BudgetSortModalProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange
}) => {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Sort Budgets"
    >
      <View style={{ marginTop: 10 }}>
        {(['name', 'amount', 'spent', 'remaining'] as const).map((mode) => {
          const isActive = sortBy === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (isActive) {
                  onSortChange(mode, !sortAsc);
                } else {
                  // Default Asc for name, Desc for others
                  onSortChange(mode, mode === 'name');
                }
                onClose();
              }}
            >
              <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
              {isActive && (
                <MaterialIcons 
                  name={sortAsc ? "arrow-upward" : "arrow-downward"} 
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

const styles = StyleSheet.create({
  pickerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
