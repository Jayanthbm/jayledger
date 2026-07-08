import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

export interface ConfirmationSheetProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  isDanger?: boolean;
}

export const ConfirmationSheet = ({
  message,
  confirmLabel,
  onConfirm,
  isLoading = false,
  isDanger = false,
}: ConfirmationSheetProps) => {
  const { colors } = useTheme();

  return (
    <View>
      <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>{message}</Text>

      <TouchableOpacity
        style={[
          styles.sheetButton,
          isDanger ? styles.sheetButtonDanger : { backgroundColor: colors.primary },
        ]}
        onPress={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sheetButtonText}>{confirmLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetMessage: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  sheetButton: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetButtonDanger: {
    backgroundColor: '#ef4444',
  },
  sheetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
