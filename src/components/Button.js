import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const Button = ({
  mode = 'filled', // filled, outlined, text, tonal, elevated
  children,
  onPress,
  icon,
  loading = false,
  disabled = false,
  style,
  contentStyle,
  labelStyle,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getBackgroundColor = () => {
    if (disabled) return colors.onSurface + '1F'; // 12% opacity
    switch (mode) {
      case 'filled':
        return colors.primary;
      case 'outlined':
      case 'text':
        return 'transparent';
      case 'tonal':
        return colors.secondaryContainer;
      case 'elevated':
        return colors.surface; // + shadow
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.onSurface + '61'; // 38% opacity
    switch (mode) {
      case 'filled':
        return colors.onPrimary;
      case 'outlined':
      case 'text':
        return colors.primary;
      case 'tonal':
        return colors.onSecondaryContainer;
      case 'elevated':
        return colors.primary;
      default:
        return colors.onPrimary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.onSurface + '1F';
    if (mode === 'outlined') return colors.outline;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: mode === 'outlined' ? 1 : 0,
          elevation: mode === 'elevated' ? 2 : 0,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} style={styles.icon} />
        ) : icon ? (
          <MaterialDesignIcons name={icon} size={20} color={getTextColor()} style={styles.icon} />
        ) : null}
        <Text style={[styles.label, { color: getTextColor() }, labelStyle]}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20, // Full rounded for buttons
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;
