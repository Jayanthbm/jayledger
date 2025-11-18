// src/components/app/ScrolltoTopIcon.jsx

import React from 'react';
import { Dimensions, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../context/ThemeContext';

const SIZE = 48;
const ICON_SIZE = 30;

const ScrolltoTopIcon = ({ visible = true, onPress, align = 'center', bottom = 65 }) => {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');

  // Horizontal positioning
  let leftPosition = null;
  let rightPosition = null;
  switch (align) {
    case 'left':
      leftPosition = 20;
      break;
    case 'right':
      rightPosition = 20;
      break;
    default:
      leftPosition = (width - SIZE) / 2 - 15;
  }

  // Scale animation for the floating button press effect
  const scale = useSharedValue(1);

  // Custom ripple shared values
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const fabStyle = useAnimatedStyle(() => ({
    opacity: visible ? 1 : 0,
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const showRipple = () => {
    rippleOpacity.value = 0.25; // ripple tint
    rippleScale.value = 0;

    rippleScale.value = withTiming(1.8, { duration: 220 });
    rippleOpacity.value = withTiming(0, { duration: 300 }, () => {
      rippleScale.value = 0;
    });
  };

  return (
    <Animated.View
      style={[
        fabStyle,
        {
          position: 'absolute',
          bottom,
          left: leftPosition,
          right: rightPosition,
          zIndex: 50,
        },
      ]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.92, { duration: 120 });
          showRipple();
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
        onPress={onPress}
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: theme.colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden', // Necessary for Ripple clipping
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 3 },
        }}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
      >
        {/* Ripple Layer */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              backgroundColor: theme.colors.primary,
            },
            rippleStyle,
          ]}
        />

        <MaterialDesignIcons name="chevron-up" size={ICON_SIZE} color={theme.colors.primary} />
      </Pressable>
    </Animated.View>
  );
};

export default ScrolltoTopIcon;
