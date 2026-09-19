import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, Platform, LogBox } from 'react-native';

LogBox.ignoreLogs(['[Reanimated] dependencies should only be used in web implementation.']);
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useTheme, ThemeProvider } from '../src/store/ThemeContext';
import { useAuth, AuthProvider } from '../src/store/AuthContext';
import { ToastProvider } from '../src/store/ToastContext';
import { initDB } from '../src/db/database';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BiometricLock } from '../src/components/BiometricLock';
import { QuickActionHandler } from '../src/components/QuickActionHandler';
import { NativeKeyboardToolbar } from '../src/components/common';
import { common } from '../src/styles/common';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  console.log('[RootLayout] Rendering. dbReady:', dbReady, 'isLocked:', isLocked);

  useEffect(() => {
    const checkBiometrics = async () => {
      const useBiometrics = await AsyncStorage.getItem('use_biometrics');
      if (useBiometrics === 'true') {
        setIsLocked(true);
      }
    };
    checkBiometrics();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current?.match(/inactive|background/) && nextAppState === 'active') {
        checkBiometrics();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function setupDB() {
      try {
        console.log('[App] Starting DB setup...');
        await initDB();
        console.log('[App] DB setup complete. Setting dbReady = true');
        setDbReady(true);
      } catch (e) {
        console.error('Database initialization failed:', e);
      }
    }
    setupDB();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (dbReady) {
      console.log('[App] DB ready, hiding splash screen');
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [dbReady]);

  // Safety fallback: Hide splash screen after 3 seconds regardless of DB state
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[App] Splash screen safety timeout triggered, forcing hide');
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={common.flex1} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {isLocked ? <BiometricLock onUnlock={() => setIsLocked(false)} /> : <RootLayoutNav />}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if user is not authenticated and trying to access other screens
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if user is authenticated and trying to access auth screens
      router.replace('/(tabs)/dashboard');
    }
  }, [session, loading, segments, router]);

  return (
    <>
      <QuickActionHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: ' ',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          animation: Platform.OS === 'android' ? 'slide_from_right' : 'default',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="goals"
          options={{
            headerShown: true,
            title: 'Goals',
          }}
        />
        <Stack.Screen
          name="daily-limit-detail"
          options={{
            headerShown: true,
            title: "Today's Activity",
          }}
        />
        <Stack.Screen
          name="calendar-view"
          options={{
            headerShown: true,
            title: 'Transaction Calendar',
          }}
        />
        <Stack.Screen
          name="add-transaction"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="add-quick-transaction"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            headerShown: true,
            title: 'Categories',
          }}
        />
        <Stack.Screen
          name="payees"
          options={{
            headerShown: true,
            title: 'Payees',
          }}
        />
        <Stack.Screen
          name="groups"
          options={{
            headerShown: true,
            title: 'Groups',
          }}
        />
        <Stack.Screen
          name="quick-transactions"
          options={{
            headerShown: true,
            title: 'Quick Transactions',
          }}
        />

        {/* Reports screens */}
        <Stack.Screen
          name="reports/living-costs"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/subscription-bills"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/payee-summary"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/category-summary"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/group-summary"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/monthly-summary"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/yearly-summary"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/yearly-category"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/yearly-payee"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/payee-overview"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="reports/category-overview"
          options={{
            headerShown: true,
          }}
        />
      </Stack>
      <NativeKeyboardToolbar />
    </>
  );
}
