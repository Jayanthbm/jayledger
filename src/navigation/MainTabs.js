import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BudgetsStack from './stacks/BudgetsStack';
import GoalsStack from './stacks/GoalsStack';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import OverviewStack from './stacks/OverviewStack';
import React from 'react';
import ReportsStack from './stacks/ReportsStack';
import SettingsStack from './stacks/SettingsStack';
import TransactionsStack from './stacks/TransactionsStack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const tabs = [
  { name: 'Overview', icon: 'grid-outline', activeIcon: 'grid', stack: OverviewStack },
  { name: 'Transactions', icon: 'reader-outline', activeIcon: 'reader', stack: TransactionsStack },
  { name: 'Budgets', icon: 'wallet-outline', activeIcon: 'wallet', stack: BudgetsStack },
  { name: 'Goals', icon: 'disc-outline', activeIcon: 'disc', stack: GoalsStack },
  { name: 'Reports', icon: 'layers-outline', activeIcon: 'layers', stack: ReportsStack },
];

//  { name: 'Settings', icon: 'settings-outline', activeIcon: 'settings', stack: SettingsStack },


export default function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceVariant,
          borderTopWidth: 0,
          elevation: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 5,
        },
        tabBarActiveTintColor: theme.colors.onActiveIndicator,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarIcon: ({ color, focused }) => {
          const tab = tabs.find(t => t.name === route.name);
          const iconName = focused ? tab.activeIcon : tab.icon;
          return (
            <View style={styles.iconContainer}>
              {focused && (
                <Animated.View
                  style={[
                    styles.activePill,
                    { backgroundColor: theme.colors.activeIndicator },
                  ]}
                />
              )}
              <Ionicons
                name={iconName}
                size={24}
                color={focused ? theme.colors.onActiveIndicator : theme.colors.onSurfaceVariant}
              />
            </View>
          );
        },
        tabBarIconStyle: {
          marginTop: 5,
        }
      })}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.stack} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 40,
  },
  activePill: {
    position: "absolute",
    width: 56,
    height: 36,
    borderRadius: 18,
    opacity: 1,
  },
});
