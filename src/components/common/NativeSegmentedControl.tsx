import React from 'react';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { SegmentedOption } from '../SegmentedControl';

interface NativeSegmentedControlProps<T = string | number | boolean> {
  options: SegmentedOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  variant?: 'small' | 'medium' | 'large';
  containerStyle?: ViewStyle;
}

export const NativeSegmentedControl = <T extends string | number | boolean>({
  options,
  selectedValue,
  onValueChange,
  variant = 'medium',
  containerStyle,
}: NativeSegmentedControlProps<T>) => {
  const { colors, isDark } = useTheme();

  // On iOS, use native SwiftUI Picker when available
  if (Platform.OS === 'ios') {
    try {
      const { Picker, Host } = require('@expo/ui/swiftui');
      if (Picker && Host) {
        const height = variant === 'small' ? 36 : variant === 'large' ? 52 : 44;
        return (
          <Host style={[{ width: '100%', height }, containerStyle]}>
            <Picker
              options={options.map((opt) => opt.label)}
              selectedIndex={options.findIndex((opt) => opt.value === selectedValue)}
              onOptionSelected={({
                nativeEvent: { index },
              }: {
                nativeEvent: { index: number };
              }) => {
                if (options[index]) {
                  onValueChange(options[index].value);
                }
              }}
              variant="segmented"
            />
          </Host>
        );
      }
    } catch {
      // Fall through to cross-platform standard layout
    }
  }

  // Cross-platform standard fallback (ensures 100% visible text, custom active colors like red for Expense, green for Income)
  const getVariantStyles = () => {
    switch (variant) {
      case 'small':
        return {
          container: { height: 38, padding: 3, borderRadius: 12 },
          tab: { borderRadius: 10 },
          text: { fontSize: 13, fontWeight: '700' as const },
        };
      case 'large':
        return {
          container: { height: 54, padding: 5, borderRadius: 16 },
          tab: { borderRadius: 12 },
          text: { fontSize: 16, fontWeight: '800' as const },
        };
      default: // medium
        return {
          container: { height: 46, padding: 4, borderRadius: 14 },
          tab: { borderRadius: 10 },
          text: { fontSize: 15, fontWeight: '700' as const },
        };
    }
  };

  const v = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA',
          borderColor: isDark ? '#2C2C2E' : '#D1D1D6',
        },
        v.container as ViewStyle,
        containerStyle,
      ]}
    >
      {options.map((option) => {
        const isActive = selectedValue === option.value;
        const activeColor = option.activeColor || colors.primary;

        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.tab,
              v.tab as ViewStyle,
              isActive && {
                backgroundColor: activeColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.text,
                v.text as TextStyle,
                {
                  color: isActive ? '#FFFFFF' : isDark ? '#8E8E93' : '#636366',
                },
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
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
