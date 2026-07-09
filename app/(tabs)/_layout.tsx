import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/store/ThemeContext';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="dashboard"
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 84 + (insets.bottom > 0 ? insets.bottom : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 14,
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Icon.glyphMap = 'help';
          if (route.name === 'dashboard')
            iconName = focused ? 'home-variant' : 'home-variant-outline';
          else if (route.name === 'transactions') iconName = 'swap-vertical';
          else if (route.name === 'budgets') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'goals') iconName = focused ? 'bullseye-arrow' : 'bullseye';
          else if (route.name === 'reports') iconName = focused ? 'chart-box' : 'chart-box-outline';
          else if (route.name === 'settings') iconName = focused ? 'tune' : 'tune-variant';

          return <Icon name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
      <Tabs.Screen name="settings" options={{ title: 'settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 14,
    borderTopWidth: 1,
    elevation: 0,
  },
});
