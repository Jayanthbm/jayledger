import React from 'react';
import { Transaction } from '../../models/types';
import { ActionModal } from '../common/ActionModal';
import { useTheme } from '../../store/ThemeContext';

interface TransactionDeleteModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const TransactionDeleteModal = React.memo(
  ({ transaction, onCancel, onConfirm }: TransactionDeleteModalProps) => {
    const { colors } = useTheme();

    return (
      <ActionModal
        visible={!!transaction}
        onClose={onCancel}
        title="Delete Transaction?"
        description="This action cannot be undone. Are you sure you want to delete this transaction?"
        icon="delete-outline"
        iconColor={colors.danger}
        primaryAction={{
          label: 'Confirm Delete',
          onPress: onConfirm,
          color: colors.danger,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: onCancel,
        }}
      />
    );
  },
);

TransactionDeleteModal.displayName = 'TransactionDeleteModal';
