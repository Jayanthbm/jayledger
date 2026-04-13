import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../store/ThemeContext';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { CustomTabBar } from '../components/CustomTabBar';
import { useNavigation } from '@react-navigation/native';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';

import { useAuth } from '../store/AuthContext';

const Tab = createMaterialTopTabNavigator();

const SCREEN_TITLES: Record<string, string> = {
  Dashboard: 'Dashboard',
  Transactions: 'Transactions',
  Budgets: 'Budgets',
  Goals: 'Goals',
  Reports: 'Reports',
};

import { syncGoals, syncTransactions, syncBudgets, syncCategories, syncPayees } from '../services/syncService';
import { DeviceEventEmitter, ActivityIndicator } from 'react-native';

export default function MainTabs() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = React.useState('Dashboard');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleGlobalRefresh = async () => {
    if (!session?.user?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const userId = session.user.id;
      // Trigger sync based on active tab
      if (activeTab === 'Goals') await syncGoals(userId, true);
      else if (activeTab === 'Transactions' || activeTab === 'Reports') await syncTransactions(userId, true);
      else if (activeTab === 'Budgets') await syncBudgets(userId, true);
      // ... Add others if needed
      
      // Notify active screen to reload
      DeviceEventEmitter.emit('module_refreshed', { module: activeTab });
    } catch (error) {
      console.warn("Global refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Global Header with Dynamic Title */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {SCREEN_TITLES[activeTab] || 'JayLedger'}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {['Dashboard', 'Transactions', 'Budgets', 'Goals', 'Reports'].includes(activeTab) && (
            <TouchableOpacity 
              onPress={handleGlobalRefresh}
              style={[styles.settingsIcon, { marginRight: 8 }]}
              activeOpacity={0.7}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Icon name="refresh" size={26} color={colors.text} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsIcon}
            activeOpacity={0.7}
          >
            <Icon name="cog-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Tab.Navigator
        tabBarPosition="bottom"
        tabBar={props => <CustomTabBar {...props} />}
        initialRouteName="Dashboard"
        screenOptions={{
          swipeEnabled: false,
          lazy: true,
        }}
        screenListeners={{
          state: (e: any) => {
            const index = e.data.state.index;
            const routeName = e.data.state.routeNames[index];
            setActiveTab(routeName);
          },
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} />
        <Tab.Screen name="Budgets" component={BudgetsScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  settingsIcon: {
    padding: 4,
  }
});
