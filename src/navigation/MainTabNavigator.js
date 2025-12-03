import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../context/ThemeContext';

import OverviewScreen from '../screens/main/OverviewScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import BudgetsScreen from '../screens/main/BudgetsScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outlineVariant,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'Overview') {
            iconName = 'badge-account-horizontal-outline';
          } else if (route.name === 'Transactions') {
            iconName = 'file-document-outline';
          } else if (route.name === 'Budgets') {
            iconName = 'wallet-outline';
          } else if (route.name === 'Reports') {
            iconName = 'chart-box-multiple-outline';
          } else if (route.name === 'Settings') {
            iconName = 'cog-outline';
          }

          return (
            <MaterialDesignIcons
              name={iconName}
              size={24}
              color={color}
            />
          );
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
