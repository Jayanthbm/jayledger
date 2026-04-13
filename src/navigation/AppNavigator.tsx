import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import SettingsStack from './SettingsStack';
import DailyLimitDetailScreen from '../screens/DailyLimitDetailScreen';
import CalendarViewScreen from '../screens/CalendarViewScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ReportView from '../screens/ReportView';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsStack} />
            <Stack.Screen name="DailyLimitDetail" component={DailyLimitDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CalendarView" component={CalendarViewScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="ReportDetail" component={ReportView} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
