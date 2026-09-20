import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/store/ThemeContext';

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName: keyof typeof MaterialIcons.glyphMap;
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  iconName,
  backgroundColor,
  iconColor = '#FFFFFF',
  iconSize = 28,
  size = 56,
  style,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const effectiveBg = backgroundColor || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: effectiveBg,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 96 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 99,
  },
});
