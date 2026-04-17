import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  backgroundColor = '#6200ee', // Default to a fallback if none provided
  iconColor = '#fff',
  iconSize = 28,
  size = 64,
  style,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius: size / 3, // M3 style: slightly rounded square
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
    right: 24,
    bottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
