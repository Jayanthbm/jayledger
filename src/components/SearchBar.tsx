import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../store/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  size = 'medium',
  onClear,
  containerStyle
}: SearchBarProps) => {
  const { colors } = useTheme();

  const getSizes = () => {
    switch (size) {
      case 'small':
        return { height: 40, iconSize: 18, fontSize: 13, paddingHorizontal: 10, borderRadius: 10 };
      case 'large':
        return { height: 56, iconSize: 24, fontSize: 17, paddingHorizontal: 16, borderRadius: 16 };
      case 'medium':
      default:
        return { height: 48, iconSize: 20, fontSize: 15, paddingHorizontal: 12, borderRadius: 12 };
    }
  };

  const sizes = getSizes();

  return (
    <View style={[
      styles.container, 
      { 
        height: sizes.height,
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: sizes.borderRadius,
        paddingHorizontal: sizes.paddingHorizontal
      },
      containerStyle
    ]}>
      <Icon name="search" size={sizes.iconSize} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary + '90'}
        style={[
          styles.input, 
          { 
            color: colors.text,
            fontSize: sizes.fontSize,
            marginLeft: 8
          }
        ]}
      />
      {value !== '' && (
        <TouchableOpacity 
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearBtn}
        >
          <Icon name="close" size={sizes.iconSize} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  }
});
