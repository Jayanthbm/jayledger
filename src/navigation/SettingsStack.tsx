import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../store/ThemeContext';
import SettingsScreen from '../screens/SettingsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import PayeesScreen from '../screens/PayeesScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categories' }} />
      <Stack.Screen name="Payees" component={PayeesScreen} options={{ title: 'Payees' }} />
    </Stack.Navigator>
  );
}
