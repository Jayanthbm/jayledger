import AllCategories from '../screens/AllCategories'
import AllPayees from '../screens/AllPayees';
import BudgetsScreen from '../screens/BudgetsScreen';
import CalendarView from '../screens/CalendarView';
import GoalsScreen from '../screens/GoalsScreen';
import IncomeVsExpense from '../screens/IncomeVsExpense';
import MonthlyLivingCosts from '../screens/MonthlyLivingCosts';
import MonthlySummary from '../screens/MonthlySummary';
// Screens
import OverviewScreen from '../screens/OverviewScreen';
import React from 'react';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionAndBills from '../screens/SubscriptionAndBills';
import TodaysView from '../screens/TodaysView';
import TransactionsByCategory from '../screens/TransactionsByCategory';
import TransactionsByPayee from '../screens/TransactionsByPayee';
import TransactionsScreen from '../screens/TransactionsScreen';
import YearlySummary from '../screens/YearlySummary';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function MainStackNavigator() {
   return (
      <Stack.Navigator
         screenOptions={{
            headerShown: false,
            animation: 'fade',
         }}
      >
         {/* Tabs */}
         <Stack.Screen name="Overview" component={OverviewScreen} />
         <Stack.Screen name="Transactions" component={TransactionsScreen} />
         <Stack.Screen name="Budgets" component={BudgetsScreen} />
         <Stack.Screen name="Goals" component={GoalsScreen} />
         <Stack.Screen name="Reports" component={ReportsScreen} />

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
         <Stack.Screen name="Settings" component={SettingsScreen} />
         <Stack.Screen name="AllCategories" component={AllCategories} />
         <Stack.Screen name="AllPayees" component={AllPayees} />
      </Stack.Navigator>
   );
}
