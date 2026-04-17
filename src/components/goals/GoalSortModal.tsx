import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface GoalSortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'progress' | 'amount';
  sortAsc: boolean;
  onSortChange: (mode: 'name' | 'progress' | 'amount', asc: boolean) => void;
}

export const GoalSortModal: React.FC<GoalSortModalProps> = ({
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
      title="Sort Goals"
    >
      <View style={{ marginTop: 10 }}>
        {[
          { label: 'Name', value: 'name' },
          { label: 'Progress', value: 'progress' },
          { label: 'Target Amount', value: 'amount' }
        ].map((item: any) => {
          const isActive = sortBy === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.sortOption, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (isActive) {
                  onSortChange(item.value, !sortAsc);
                } else {
                  onSortChange(item.value, true);
                }
                onClose();
              }}
            >
              <Text style={[styles.sortOptionText, { color: isActive ? colors.primary : colors.text }]}>
                {item.label}
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

const styles = StyleSheet.create({
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
