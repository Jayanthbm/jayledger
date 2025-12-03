// src/navigation/MainTabs.js

import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
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


  const labelStyle = useAnimatedStyle(() => {
    return {
      color: isFocused ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
      fontWeight: isFocused ? '700' : '500',
    };
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        pressed && Platform.OS !== 'android' && { backgroundColor: theme.colors.onSurfaceVariant + '1F' },
      ]}
      android_ripple={{
        color: theme.colors.onSurfaceVariant + '1F',
        borderless: true,
        foreground: true,
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

function MainTabs({ state, descriptors, navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        // Map route name to tab config
        const tab = TABS.find(t => t.name === route.name);
        if (!tab) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            theme={theme}
            onPress={onPress}
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
    position: 'relative',
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default React.memo(MainTabs);
