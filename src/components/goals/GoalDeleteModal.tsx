import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { BottomSheet } from '../BottomSheet';
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
    <BottomSheet visible={visible} onClose={onClose} title="Delete Goal?" showCloseButton={true}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.danger + '15' }]}>
          <Icon name="warning" size={40} color={colors.danger} />
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Are you perfectly sure you want to delete this Goal? This action cannot be undone and will
          permanently remove it from your dashboard.
        </Text>

        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: colors.danger }]}
          onPress={onConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmBtnText}>Yes, Delete</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

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
