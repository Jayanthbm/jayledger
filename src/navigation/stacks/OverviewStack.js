import CalendarView from '../../screens/OverView/CalendarView';
import MonthlyLivingCosts from '../../screens/OverView/MonthlyLivingCosts';
import OverviewScreen from '../../screens/OverView/OverviewScreen';
import React from 'react';
import TodaysView from '../../screens/OverView/TodyasView';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function OverviewStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OverviewMain" component={OverviewScreen} />
      <Stack.Screen name="TodaysView" component={TodaysView} />
      <Stack.Screen name="CalendarView" component={CalendarView} />
      <Stack.Screen name="MonthlyLivingCosts" component={MonthlyLivingCosts} />
    </Stack.Navigator>
  );
}
