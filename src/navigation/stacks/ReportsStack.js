import IncomeVsExpense from '../../screens/Reports/IncomeVsExpense';
import MonthlySummary from '../../screens/Reports/MonthlySummary';
import React from 'react';
import ReportsScreen from '../../screens/Reports/ReportsScreen';
import YearlySummary from '../../screens/Reports/YearlySummary';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportsMain" component={ReportsScreen} />
      <Stack.Screen name="MonthlySummary" component={MonthlySummary} />
      <Stack.Screen name="YearlySummary" component={YearlySummary} />
      <Stack.Screen name="IncomeVsExpense" component={IncomeVsExpense} />
    </Stack.Navigator>
  );
}
