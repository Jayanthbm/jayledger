import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';

interface BudgetDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const BudgetDeleteModal: React.FC<BudgetDeleteModalProps> = ({
  visible,
  onClose,
  onConfirm
}) => {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Delete Budget?"
    >
      <View>
        <Text style={[styles.deleteSubText, { color: colors.textSecondary }]}>
          This will remove the budget target but transactions will remain.
        </Text>
        <View style={styles.deleteActions}>
          <TouchableOpacity
            style={[styles.confirmDeleteBtn, { backgroundColor: colors.danger }]}
            onPress={onConfirm}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  deleteSubText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
