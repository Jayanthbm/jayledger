// src/navigation/RootNavigator.js

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BackHandler, ToastAndroid, View } from 'react-native';
import React, { useEffect, useState } from 'react';

import LoginScreen from '../screens/LoginScreen';
import { MAINSTYLE } from '../styles/style';
import MainStackNavigator from './MainStackNavigator';
import SplashScreen from '../screens/SplashScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './NavigationRef';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function MainLayout() {
  return (
    <View style={{ ...MAINSTYLE, flex: 1 }}>
      <MainStackNavigator />
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Handle back button
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

  // When auth loading completes, hide splash
  useEffect(() => {
    if (!loading) {
      setIsSplashVisible(false);
    }
  }, [loading]);

  // 🔹 While splash active → animate fade out when ready
  if (isSplashVisible) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(400)}
        style={{ flex: 1 }}
      >
        <SplashScreen />
      </Animated.View>
    );
  }
  // 🔹 Normal navigation flow
  return (
    <Animated.View
      entering={FadeIn.duration(400).springify().mass(0.6).damping(20)}
      exiting={FadeOut.duration(300)}
      style={{ flex: 1 }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainLayout} />
        )}
      </Stack.Navigator>
    </Animated.View>
  );
}
