import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';

import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import DailyLimitDetailScreen from '../screens/DailyLimitDetailScreen';
import CalendarViewScreen from '../screens/CalendarViewScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ReportView from '../screens/ReportView';
import CategoriesScreen from '../screens/CategoriesScreen';
import PayeesScreen from '../screens/PayeesScreen';
import QuickTransactionsScreen from '../screens/QuickTransactionsScreen';
import AddQuickTransactionScreen from '../screens/AddQuickTransactionScreen';
import Icon from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const standardHeaderLeft = (navigation: any) => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ paddingRight: 12, justifyContent: 'center', alignItems: 'center' }}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <Icon name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerBackTitle: '',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
          gestureEnabled: true,
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="DailyLimitDetail"
              component={DailyLimitDetailScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: "Today's Activity",
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="CalendarView"
              component={CalendarViewScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Transaction Calendar',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen
              name="ReportDetail"
              component={ReportView}
              options={({ route, navigation }: any) => ({
                headerShown: true,
                title: route.params?.title || 'Report',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Categories',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="Payees"
              component={PayeesScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Payees',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="QuickTransactions"
              component={QuickTransactionsScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Quick Transactions',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation)
              })}
            />
            <Stack.Screen
              name="AddQuickTransaction"
              component={AddQuickTransactionScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_bottom'
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
