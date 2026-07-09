import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useTheme, ThemeProvider } from '../src/store/ThemeContext';
import { useAuth, AuthProvider } from '../src/store/AuthContext';
import { ToastProvider } from '../src/store/ToastContext';
import { initDB } from '../src/db/database';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BiometricLock } from '../src/components/BiometricLock';
import { QuickActionHandler } from '../src/components/QuickActionHandler';
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
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkBiometrics();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const setup = async () => {
      console.log('[App] Starting DB setup...');
      try {
        await initDB();
        console.log('[App] DB setup complete. Setting dbReady = true');
        setDbReady(true);
      } catch (error) {
        console.error('[App] Critical DB Setup Error:', error);
        setDbReady(true);
      }
    };
    setup();
  }, []);

  // Hide splash screen when DB is ready
  useEffect(() => {
    if (dbReady) {
      console.log('[App] DB ready, hiding splash screen');
      SplashScreen.hideAsync().catch((error) => {
        console.error('[App] Error hiding splash screen:', error);
      });
    }
  }, [dbReady]);

  // Safety fallback to force hide splash screen after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('[App] Splash screen safety timeout triggered, forcing hide');
      SplashScreen.hideAsync().catch((error) => {
        // Safe to ignore if already hidden
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (!dbReady) {
    return null; // Keep splash screen visible while DB initializes
  }

  return (
    <GestureHandlerRootView style={common.flex1}>
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
  }, [session, loading, segments]);

  const standardHeaderLeft = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.headerLeftBtn}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Icon name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
    ),
    [router, colors.text],
  );

  return (
    <>
      <QuickActionHandler />
      <Stack
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="daily-limit-detail"
          options={{
            headerShown: true,
            title: "Today's Activity",
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="calendar-view"
          options={{
            headerShown: true,
            title: 'Transaction Calendar',
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
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
            title: 'categories',
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="payees"
          options={{
            headerShown: true,
            title: 'payees',
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="groups"
          options={{
            headerShown: true,
            title: 'groups',
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="quick-transactions"
          options={{
            headerShown: true,
            title: 'Quick Transactions',
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />

        {/* Reports screens */}
        <Stack.Screen
          name="reports/living-costs"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/subscription-bills"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/payee-summary"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/category-summary"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/group-summary"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/monthly-summary"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/yearly-summary"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/yearly-category"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/yearly-payee"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/payee-overview"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
        <Stack.Screen
          name="reports/category-overview"
          options={{
            headerShown: true,
            headerBackTitle: ' ',
            headerLeft: () => standardHeaderLeft(),
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerLeftBtn: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
