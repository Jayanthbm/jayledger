import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from '../BottomSheet';
import { useTheme } from '../../store/ThemeContext';
import { common } from '../../styles/common';

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
    <BottomSheet visible={visible} onClose={onClose} title="Delete Goal">
      <View>
        <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>
          Are you perfectly sure you want to delete this Goal? This action cannot be undone.
        </Text>

        <TouchableOpacity
          style={[styles.sheetButton, { backgroundColor: colors.danger }]}
          onPress={onConfirm}
        >
          <Text style={common.textWhiteBold16}>Yes, Delete</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  sheetButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
});
