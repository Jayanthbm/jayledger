// src/navigation/MainTabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MainTabs from './MainTabs';

// Screens
import OverviewScreen from '../screens/OverviewScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MainTabs {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
