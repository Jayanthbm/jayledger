import React from 'react';
import { ActionModal } from '../common/ActionModal';
import { useTheme } from '../../store/ThemeContext';

interface GoalDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();

  return (
    <ActionModal
      visible={visible}
      onClose={onClose}
      title="Delete Goal?"
      description="Are you perfectly sure you want to delete this Goal? This action cannot be undone."
      icon="warning"
      iconColor={colors.danger}
      primaryAction={{
        label: 'Yes, Delete',
        onPress: onConfirm,
        color: colors.danger,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    />
  );
};
