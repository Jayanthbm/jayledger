import React from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { NativeLoadingIndicator } from './NativeLoadingIndicator';

interface NativeButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'filled' | 'outlined' | 'text';
}

export const NativeButton: React.FC<NativeButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'filled',
}) => {
  // On iOS / Android, when pure button styling is desired
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      const { Button: ExpoButton, Host } = require('@expo/ui');
      if (ExpoButton && Host) {
        return (
          <Host style={[{ height: 50, width: '100%' }, style]}>
            <ExpoButton
              label={loading ? 'Please wait...' : title}
              variant={variant}
              disabled={disabled || loading}
              onPress={onPress}
            />
          </Host>
        );
      }
    } catch {
      // Fall through to standard layout
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <NativeLoadingIndicator color="#121417" />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A0C4FF',
  },
  text: {
    color: '#002B5B',
    fontSize: 18,
    fontWeight: '700',
  },
});
