import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import TransactionFormScreen from '../screens/main/TransactionFormScreen';
import BudgetFormScreen from '../screens/main/BudgetFormScreen';

const Stack = createNativeStackNavigator();

const MainStack = () => {
   return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
         <Stack.Screen name="Tabs" component={MainTabNavigator} />
         <Stack.Screen
            name="TransactionForm"
            component={TransactionFormScreen}
            options={{ presentation: 'modal', headerShown: false }}
         />
         <Stack.Screen
            name="BudgetForm"
            component={BudgetFormScreen}
            options={{ presentation: 'modal', headerShown: false }}
         />
      </Stack.Navigator>
   );
};

export default MainStack;
