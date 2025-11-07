// src/components/core/IconButton.jsx

import { Pressable, StyleSheet, View } from 'react-native';

import Loader from './Loader';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function IconButton({
  iconName,
  onPress,
  mode = 'filled', // 'filled' | 'outlined' | 'tonal'
  type = 'primary', // 'primary' | 'warning' | 'danger' | 'disabled'
  size = 24,
  iconColor,
  disabled = false,
  loading = false,
  style,
  keyName = '',
}) {
  const { theme } = useTheme();
  const colors = theme.colors;

  // 🎨 Type-based color palette
  const colorMap = {
    primary: {
      bg: colors.primaryContainer,
      onBg: colors.onPrimaryContainer,
      border: colors.primary,
    },
    warning: {
      bg: '#FFF4E5',
      onBg: '#8A6100',
      border: '#FFB300',
    },
    danger: {
      bg: colors.errorContainer,
      onBg: colors.onErrorContainer,
      border: colors.error,
    },
    disabled: {
      bg: colors.surfaceVariant,
      onBg: colors.onSurfaceVariant,
      border: colors.outline,
    },
  };

  const palette = colorMap[type] || colorMap.primary;

  // 💅 Mode variants
  let backgroundColor, borderColor, tintColor, elevation;

  switch (mode) {
    case 'outlined':
      backgroundColor = 'transparent';
      borderColor = palette.border;
      tintColor = palette.border;
      elevation = 0;
      break;

    case 'tonal':
      backgroundColor = colors.secondaryContainer;
      borderColor = 'transparent';
      tintColor = colors.onSecondaryContainer;
      elevation = 0;
      break;

    default: // filled
      backgroundColor = palette.bg;
      borderColor = 'transparent';
      tintColor = palette.onBg;
      elevation = 2;
      break;
  }

  const iconDisplayColor = iconColor || tintColor;

  return (
    <Pressable
      key={`${theme.mode}-${keyName}`}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: colors.surfaceVariant }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.9 : 1 }],
          elevation,
        },
        style,
      ]}
    >
      {loading ? (
        <Loader inline position="center" size="small" variant="contained" />
      ) : (
        <View style={styles.iconContainer}>
          <MaterialDesignIcons name={iconName} size={size} color={iconDisplayColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
