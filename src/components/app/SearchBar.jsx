// src/components/app/SearchBar.jsx

import { Animated, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';

import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '../../context/ThemeContext';

const SearchBar = ({
  placeholder = 'Search',
  value,
  onChangeText,
  onClear,
  style,
  disabled = false,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Animated elevation for Material 3 focus effect
  const elevation = new Animated.Value(0);

  const animateFocus = (toValue) => {
    Animated.timing(elevation, {
      toValue,
      duration: 120,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
    animateFocus(4); // raised when active
  };

  const handleBlur = () => {
    setIsFocused(false);
    animateFocus(0); // flat when inactive
  };

  const backgroundColor = isFocused ? theme.colors.surface : theme.colors.searchContainer;

  const textColor = theme.colors.onSurfaceVariant;

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 24,
          backgroundColor,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginVertical: 6,
          elevation: elevation,
          shadowColor: theme.colors.shadow,
          shadowOpacity: isFocused ? 0.2 : 0,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: isFocused ? 3 : 0,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.onSurfaceVariant}
        style={{ marginRight: 8 }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant + '99'}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly={disabled}
        style={{
          flex: 1,
          color: textColor,
          fontSize: 16,
          paddingVertical: 6,
        }}
        {...props}
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default SearchBar;
