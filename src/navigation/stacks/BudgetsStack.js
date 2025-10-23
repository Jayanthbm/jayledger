import BudgetsScreen from '../../screens/Budgets/BudgetsScreen';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

export default function BudgetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetsMain" component={BudgetsScreen} />
    </Stack.Navigator>
  );
}
