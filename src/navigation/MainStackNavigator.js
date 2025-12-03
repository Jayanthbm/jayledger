// src/navigation/MainStackNavigator.js

import AllCategories from '../screens/AllCategories';
import AllPayees from '../screens/AllPayees';
import CalendarView from '../screens/CalendarView';
import CategoriesScreen from '../screens/CategoriesScreen';
import IncomeVsExpense from '../screens/IncomeVsExpense';
import MonthlyLivingCosts from '../screens/MonthlyLivingCosts';
import MonthlySummary from '../screens/MonthlySummary';
import PayeesScreen from '../screens/PayeesScreen';
import React from 'react';
import SubscriptionAndBills from '../screens/SubscriptionAndBills';
import TodaysView from '../screens/TodaysView';
import TransactionsByCategory from '../screens/TransactionsByCategory';
import TransactionsByPayee from '../screens/TransactionsByPayee';
import YearlySummary from '../screens/YearlySummary';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

import MainTabNavigator from './MainTabNavigator';

// ... imports

export default function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Other navigable screens */}
      <Stack.Screen name="TodaysView" component={TodaysView} />
      <Stack.Screen name="CalendarView" component={CalendarView} />
      <Stack.Screen name="MonthlyLivingCosts" component={MonthlyLivingCosts} />
      <Stack.Screen name="TransactionsByPayee" component={TransactionsByPayee} />
      <Stack.Screen name="TransactionsByCategory" component={TransactionsByCategory} />
      <Stack.Screen name="MonthlySummary" component={MonthlySummary} />
      <Stack.Screen name="YearlySummary" component={YearlySummary} />
      <Stack.Screen name="IncomeVsExpense" component={IncomeVsExpense} />
      <Stack.Screen name="SubscriptionAndBills" component={SubscriptionAndBills} />
      <Stack.Screen name="AllCategories" component={AllCategories} />
      <Stack.Screen name="AllPayees" component={AllPayees} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Payees" component={PayeesScreen} />
    </Stack.Navigator>
  );
}
