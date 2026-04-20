import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Budget } from '../../models/types';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';

interface BudgetDeleteModalProps {
  budget: Budget | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const BudgetDeleteModal = React.memo(
  ({ budget, onCancel, onConfirm }: BudgetDeleteModalProps) => {
    const { colors } = useTheme();

    return (
      <BottomSheet
        visible={!!budget}
        onClose={onCancel}
        title="Delete Budget?"
        showCloseButton={true}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.danger + '15' }]}>
            <Icon name="delete-outline" size={40} color={colors.danger} />
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {`This action cannot be undone. Are you sure you want to delete the budget "${budget?.name}" from your records?`}
          </Text>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.danger }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>Confirm Delete</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  confirmBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});

BudgetDeleteModal.displayName = 'BudgetDeleteModal';
