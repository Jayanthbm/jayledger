// src/navigation/MainTabs.js

import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';

const TABS = [
  {
    name: 'Overview',
    label: 'Overview',
    icon: 'badge-account-horizontal-outline',
    activeIcon: 'badge-account-horizontal',
  },
  {
    name: 'Transactions',
    label: 'Transactions',
    icon: 'file-document-outline',
    activeIcon: 'file-document',
  },
  { name: 'Budgets', label: 'Budgets', icon: 'wallet-outline', activeIcon: 'wallet' },
  {
    name: 'Reports',
    label: 'Reports',
    icon: 'chart-box-multiple-outline',
    activeIcon: 'chart-box-multiple',
  },
  { name: 'Settings', label: 'Settings', icon: 'cog-outline', activeIcon: 'cog' },
];

const TAB_HEIGHT = 80;
const PILL_HEIGHT = 32;
const PILL_WIDTH = 64;

function MainTabs() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const state = useNavigationState((state) => state);
  const mainRoute = state?.routes?.find((r) => r.name === 'Main');
  const nestedState = mainRoute?.state;
  const currentRoute = nestedState?.routes?.[nestedState.index ?? 0]?.name ?? 'Overview';

  // Determine active index
  let activeIndex = TABS.findIndex((tab) => tab.name === currentRoute);
  if (activeIndex === -1) activeIndex = 0;

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / TABS.length;

  // Shared value for the active index
  const activeIndexAnim = useSharedValue(activeIndex);

  useEffect(() => {
    activeIndexAnim.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex]);

  // Animated style for the pill
  const pillStyle = useAnimatedStyle(() => {
    const translateX = activeIndexAnim.value * tabWidth + (tabWidth - PILL_WIDTH) / 2;
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Animated Pill */}
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.secondaryContainer },
          pillStyle,
        ]}
      />

      {TABS.map((tab, index) => {
        const isFocused = index === activeIndex;

        // Icon animation
        const iconStyle = useAnimatedStyle(() => {
          const isActive = Math.abs(activeIndexAnim.value - index) < 0.5;
          return {
            transform: [
              { scale: withSpring(isActive ? 1 : 0.9) },
            ],
          };
        });

        // Label animation
        const labelStyle = useAnimatedStyle(() => {
          const isActive = Math.abs(activeIndexAnim.value - index) < 0.5;
          return {
            opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
            fontWeight: isActive ? '700' : '500',
          };
        });

        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate('Main', { screen: tab.name })}
            style={styles.tab}
            android_ripple={{
              color: theme.colors.onSurfaceVariant + '11',
              borderless: true,
              radius: 40,
            }}
          >
            <Animated.View style={[styles.iconContainer, iconStyle]}>
              <MaterialDesignIcons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={24}
                color={isFocused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
              />
            </Animated.View>
            <Animated.Text
              style={[
                styles.label,
                { color: isFocused ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                labelStyle,
              ]}
            >
              {tab.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8, // Add elevation for shadow
    borderTopWidth: 0,
    alignItems: 'center',
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  pill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: 16,
    top: 12, // Aligned with icon
  },
  iconContainer: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default React.memo(MainTabs);
