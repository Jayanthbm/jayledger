import React from 'react';
import { Platform, ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

interface NativeLoadingIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: ViewStyle;
}

export const NativeLoadingIndicator: React.FC<NativeLoadingIndicatorProps> = ({
  size = 'large',
  color,
  style,
}) => {
  const { colors } = useTheme();
  const indicatorColor = color || colors.primary;

  // On Android, use native Jetpack Compose LoadingIndicator if available
  if (Platform.OS === 'android') {
    try {
      const { LoadingIndicator, Host } = require('@expo/ui/jetpack-compose');
      if (LoadingIndicator && Host) {
        const dim =
          size === 'small' ? 24 : size === 'large' ? 48 : typeof size === 'number' ? size : 48;
        return (
          <View style={[styles.container, style]}>
            <Host style={{ width: dim, height: dim }}>
              <LoadingIndicator color={indicatorColor} />
            </Host>
          </View>
        );
      }
    } catch {
      // Fall through to standard layout
    }
  }

  // Cross-platform standard ActivityIndicator fallback
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size as 'small' | 'large'} color={indicatorColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
