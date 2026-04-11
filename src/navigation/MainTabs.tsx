import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../store/ThemeContext';
import { TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import Screens (Placeholders for now)
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Icon>['name'] = 'error';
          if (route.name === 'Dashboard') iconName = 'dashboard';
          else if (route.name === 'Transactions') iconName = 'receipt-long';
          else if (route.name === 'Budgets') iconName = 'pie-chart';
          else if (route.name === 'Goals') iconName = 'flag';
          else if (route.name === 'Reports') iconName = 'bar-chart';
          return <Icon name={iconName} size={size + 4} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: colors.card,
          borderRadius: 25,
          height: 70,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => {
          const navigation = useNavigation<any>();
          return (
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 16 }}
            >
              <Icon name="settings" size={24} color={colors.text} />
            </TouchableOpacity>
          );
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
