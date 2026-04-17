import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../store/ThemeContext';

export interface SegmentedOption<T = string | number | boolean> {
  label: string;
  value: T;
  activeColor?: string;
}

interface SegmentedControlProps<T = string | number | boolean> {
  options: SegmentedOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  variant?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
}

export const SegmentedControl = <T extends string | number | boolean>({
  options,
  selectedValue,
  onValueChange,
  variant = 'medium',
  containerStyle,
}: SegmentedControlProps<T>) => {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'small':
        return {
          container: { height: 38, padding: 3, borderRadius: 12 },
          tab: { borderRadius: 10 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'large':
        return {
          container: { height: 56, padding: 6, borderRadius: 18 },
          tab: { borderRadius: 14 },
          text: { fontSize: 16, fontWeight: '800' },
        };
      default: // medium
        return {
          container: { height: 48, padding: 4, borderRadius: 16 },
          tab: { borderRadius: 12 },
          text: { fontSize: 15, fontWeight: '700' },
        };
    }
  };

  const v = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        v.container as ViewStyle,
        containerStyle,
      ]}
    >
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        const activeColor = option.activeColor || colors.primary;

        return (
          <TouchableOpacity
            key={option.value.toString()}
            style={[styles.tab, v.tab as ViewStyle, isActive && { backgroundColor: activeColor }]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.text,
                v.text as TextStyle,
                isActive ? styles.textActive : { color: colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  textActive: {
    color: '#fff',
  },
});
