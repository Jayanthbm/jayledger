// src/navigation/MainTabs.js

import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
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

function TabItem({ tab, isFocused, theme, onPress }) {
  const progress = useDerivedValue(() => {
    return withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const pillStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scaleX: progress.value }],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      color: isFocused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    return {
      color: isFocused ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
      fontWeight: isFocused ? '700' : '500',
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      android_ripple={{
        color: theme.colors.onSurfaceVariant + '11',
        borderless: true,
        radius: 40,
      }}
    >
      <View style={styles.iconContainer}>
        {/* Pill Background */}
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: theme.colors.secondaryContainer },
            pillStyle,
          ]}
        />
        {/* Icon */}
        <MaterialDesignIcons
          name={isFocused ? tab.activeIcon : tab.icon}
          size={24}
          color={isFocused ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
        />
      </View>
      <Animated.Text style={[styles.label, labelStyle]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

function MainTabs() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const state = useNavigationState((state) => state);
  const mainRoute = state?.routes?.find((r) => r.name === 'Main');
  const nestedState = mainRoute?.state;
  const currentRoute = nestedState?.routes?.[nestedState.index ?? 0]?.name ?? 'Overview';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {TABS.map((tab) => {
        const isFocused = currentRoute === tab.name;
        return (
          <TabItem
            key={tab.name}
            tab={tab}
            isFocused={isFocused}
            theme={theme}
            onPress={() => navigation.navigate('Main', { screen: tab.name })}
          />
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
    elevation: 8,
    borderTopWidth: 0,
    alignItems: 'center',
    shadowColor: '#000',
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
  iconContainer: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative', // Ensure pill is positioned relative to this container
  },
  pill: {
    ...StyleSheet.absoluteFillObject, // Fill the icon container
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default React.memo(MainTabs);
