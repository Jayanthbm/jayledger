import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/store/ThemeContext';
import { NativeLoadingIndicator } from './NativeLoadingIndicator';

interface NativeHeaderIconButtonProps {
  onPress: () => void;
  iconName: keyof typeof MaterialIcons.glyphMap;
  systemImage?: string;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export const NativeHeaderIconButton: React.FC<NativeHeaderIconButtonProps> = ({
  onPress,
  iconName,
  disabled = false,
  loading = false,
  accessibilityLabel = 'Action',
}) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <NativeLoadingIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.button}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.6}
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons name={iconName} size={24} color={colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    height: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Platform.OS === 'ios' ? 8 : 16,
  },
  button: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 0,
    paddingRight: Platform.OS === 'ios' ? 8 : 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
