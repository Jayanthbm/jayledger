import React from 'react';
import TransactionsByCategory from '../../screens/Transactions/TransactionsByCategory';
import TransactionsByPayee from '../../screens/Transactions/TransactionsByPayee';
import TransactionsScreen from '../../screens/Transactions/TransactionsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionsMain" component={TransactionsScreen} />
      <Stack.Screen name="TransactionsByPayee" component={TransactionsByPayee} />
      <Stack.Screen name="TransactionsByCategory" component={TransactionsByCategory} />
    </Stack.Navigator>
  );
}
