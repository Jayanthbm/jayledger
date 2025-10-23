import GoalsScreen from '../../screens/Goals/GoalsScreen';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GoalsMain" component={GoalsScreen} />
    </Stack.Navigator>
  );
}
