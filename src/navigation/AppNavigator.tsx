import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { Platform, StyleSheet } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { RootStackParamList } from './navigationTypes';
import { QuickActionHandler } from '../components/QuickActionHandler';

import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MainTabs from './MainTabs';
import DailyLimitDetailScreen from '../screens/DailyLimitDetailScreen';
import CalendarViewScreen from '../screens/CalendarViewScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';

import CategoriesScreen from '../screens/CategoriesScreen';
import PayeesScreen from '../screens/PayeesScreen';
import QuickTransactionsScreen from '../screens/QuickTransactionsScreen';
import AddQuickTransactionScreen from '../screens/AddQuickTransactionScreen';
import LivingCostsReportScreen from '../screens/reports/LivingCostsReportScreen';
import SubscriptionBillsReportScreen from '../screens/reports/SubscriptionBillsReportScreen';
import PayeeSummaryReportScreen from '../screens/reports/PayeeSummaryReportScreen';
import CategorySummaryReportScreen from '../screens/reports/CategorySummaryReportScreen';
import MonthlySummaryReportScreen from '../screens/reports/MonthlySummaryReportScreen';
import YearlySummaryReportScreen from '../screens/reports/YearlySummaryReportScreen';
import YearlyCategoryReportScreen from '../screens/reports/YearlyCategoryReportScreen';
import YearlyPayeeReportScreen from '../screens/reports/YearlyPayeeReportScreen';
import PayeeOverviewReportScreen from '../screens/reports/PayeeOverviewReportScreen';
import CategoryOverviewReportScreen from '../screens/reports/CategoryOverviewReportScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupSummaryReportScreen from '../screens/reports/GroupSummaryReportScreen';
import Icon from '@expo/vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  // Don't show intermediate loading screen - splash screen handles this
  // Just render the navigation structure immediately

  const standardHeaderLeft = (navigation: { goBack: () => void }) => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.headerLeftBtn}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <Icon name="arrow-back" size={24} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <NavigationContainer>
      <QuickActionHandler />
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
        {loading ? (
          <Stack.Screen name="Login" component={LoadingScreen} />
        ) : session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="DailyLimitDetail"
              component={DailyLimitDetailScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: "Today's Activity",
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="CalendarView"
              component={CalendarViewScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Transaction Calendar',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="AddTransaction"
              component={AddTransactionScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_bottom',
              }}
            />

            <Stack.Screen
              name="LivingCostsReport"
              component={LivingCostsReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="SubscriptionBillsReport"
              component={SubscriptionBillsReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="PayeeSummaryReport"
              component={PayeeSummaryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="CategorySummaryReport"
              component={CategorySummaryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="GroupSummaryReport"
              component={GroupSummaryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="MonthlySummaryReport"
              component={MonthlySummaryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="YearlySummaryReport"
              component={YearlySummaryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="YearlyCategoryReport"
              component={YearlyCategoryReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="YearlyPayeeReport"
              component={YearlyPayeeReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="PayeeOverviewReport"
              component={PayeeOverviewReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="CategoryOverviewReport"
              component={CategoryOverviewReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Categories',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="Payees"
              component={PayeesScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Payees',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="Groups"
              component={GroupsScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Groups',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="QuickTransactions"
              component={QuickTransactionsScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: 'Quick Transactions',
                headerBackTitle: ' ',
                headerLeft: () => standardHeaderLeft(navigation),
              })}
            />
            <Stack.Screen
              name="AddQuickTransaction"
              component={AddQuickTransactionScreen}
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'slide_from_bottom',
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

const styles = StyleSheet.create({
  headerLeftBtn: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
