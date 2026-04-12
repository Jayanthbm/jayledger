import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width - 48; // 24 margin on each side
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomTabBar: React.FC<MaterialTopTabBarProps> = ({ state, descriptors, navigation, position }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Adjusted for full width bar
  const FULL_WIDTH = width;
  const PILL_WIDTH = 64;
  const PILL_HEIGHT = 32;
  const TAB_WIDTH_FULL = FULL_WIDTH / state.routes.length;

  const translateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * TAB_WIDTH_FULL + (TAB_WIDTH_FULL - PILL_WIDTH) / 2),
  });

  return (
    <View style={[
      styles.bar, 
      { 
        backgroundColor: isDark ? '#1F2937' : '#F7F9FC',
        paddingBottom: 8,
        borderTopColor: colors.border,
      }
    ]}>
      {/* M3 Active Indicator Pill */}
      <Animated.View 
        style={[
          styles.highlight, 
          { 
            width: PILL_WIDTH,
            height: PILL_HEIGHT,
            borderRadius: PILL_HEIGHT / 2,
            backgroundColor: colors.primary + '25',
            transform: [{ translateX }],
            top: 16, // Center vertically in the upper part of the bar
          }
        ]} 
      />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName: any = 'alert-circle';
        if (route.name === 'Dashboard') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'Transactions') iconName = isFocused ? 'card-text' : 'card-text-outline';
        else if (route.name === 'Budgets') iconName = isFocused ? 'chart-arc' : 'chart-arc';
        else if (route.name === 'Goals') iconName = isFocused ? 'flag' : 'flag-outline';
        else if (route.name === 'Reports') iconName = isFocused ? 'chart-bar' : 'chart-bar-stacked';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={1}
          >
            <View style={styles.iconWrapper}>
              <Icon 
                name={iconName} 
                size={24} 
                color={isFocused ? colors.primary : colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    width: '100%',
    height: 88, // M3 standard height + padding
    alignItems: 'flex-start',
    paddingTop: 16,
    borderTopWidth: 1,
    elevation: 0,
  },
  tab: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    zIndex: -1,
  }
});
