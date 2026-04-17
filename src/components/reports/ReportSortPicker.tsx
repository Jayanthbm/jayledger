import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import Icon from '@expo/vector-icons/MaterialIcons';

interface ReportSortPickerProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'amount';
  sortAsc: boolean;
  onSortChange: (sortBy: 'name' | 'amount', sortAsc: boolean) => void;
  colors: any;
}

export const ReportSortPicker: React.FC<ReportSortPickerProps> = ({
  visible,
  onClose,
  sortBy,
  sortAsc,
  onSortChange,
  colors
}) => {
  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Amount', value: 'amount' },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Sort Results"
    >
      <View style={{ marginTop: 10 }}>
        {sortOptions.map((opt) => {
          const isActive = sortBy === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pickerItemRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (isActive) {
                  onSortChange(opt.value as any, !sortAsc);
                } else {
                  onSortChange(opt.value as any, opt.value === 'name'); // Default Asc for name, Desc for amount
                }
                onClose();
              }}
            >
              <Text style={[styles.pickerText, { color: isActive ? colors.primary : colors.text }]}>{opt.label}</Text>
              {isActive && (
                <Icon 
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
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 16, fontWeight: '500' },
});
