// src/components/app/ScrolltoTopIcon.jsx

import React from 'react';
import { Dimensions, Pressable, Platform } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../context/ThemeContext';

const ICON_SIZE = 32;

const ScrolltoTopIcon = ({
  visible = true,
  onPress,
  align = 'center', // 'left', 'right', 'center'
  bottom = 80, // distance from bottom
}) => {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');

  // 🔹 Determine horizontal alignment
  let leftPosition = null;
  let rightPosition = null;

  switch (align) {
    case 'left':
      leftPosition = 20;
      break;
    case 'right':
      rightPosition = 20;
      break;
    default: // center
      leftPosition = (width - ICON_SIZE) / 2 - 15;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: theme.colors.surfaceVariant ?? theme.colors.primary + '33',
        radius: ICON_SIZE + 10,
        borderless: true,
      }}
      style={({ pressed }) => [
        {
          position: 'absolute',
          bottom,
          left: leftPosition,
          right: rightPosition,
          opacity: visible ? (pressed ? 0.6 : 1) : 0,
          zIndex: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: ICON_SIZE,
          overflow: 'hidden', // needed for ripple clipping
        },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
    >
      <MaterialDesignIcons name="chevron-up-circle" size={ICON_SIZE} color={theme.colors.primary} />
    </Pressable>
  );
};

export default ScrolltoTopIcon;
