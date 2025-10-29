import { BackHandler, ToastAndroid, View } from 'react-native';
import React, { useEffect } from 'react';

import Loader from '../components/core/Loader';
import LoginScreen from '../screens/LoginScreen';
import MainStackNavigator from './MainStackNavigator'
// Custom bottom tabs
import MainTabs from './MainTabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './NavigationRef';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function MainLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Stack and Tabs share the same navigation context */}
      <MainStackNavigator />
      {/* ✅ Persistent Bottom Tabs */}
      <MainTabs />
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    let backPressCount = 0;
    const backAction = () => {
      if (navigationRef?.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      if (backPressCount === 0) {
        backPressCount += 1;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        setTimeout(() => (backPressCount = 0), 2000);
        return true;
      }

      BackHandler.exitApp();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, []);

  if (loading) {
    return (
      <Loader
        loading={true}
        inline={false}
        text="Loading..."
        position="center"
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 🔹 If user not logged in */}
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainLayout} />
      )}
    </Stack.Navigator>
  );
}
