import React, { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from './src/store/ThemeContext';
import { AuthProvider } from './src/store/AuthContext';
import { ToastProvider } from './src/store/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db/database';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BiometricLock } from './src/components/BiometricLock';
import { common } from './src/styles/common';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

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
        // Set ready anyway to not block the app
        setDbReady(true);
      }
    };
    setup();
  }, []);

  // Hide splash screen when both are ready
  useEffect(() => {
    if (dbReady && authReady) {
      console.log('[App] All ready, hiding splash screen');
      SplashScreen.hideAsync().catch((error) => {
        console.error('[App] Error hiding splash screen:', error);
      });
    }
  }, [dbReady, authReady]);

  if (!dbReady) {
    return null; // Keep splash screen visible while DB initializes
  }

  if (isLocked) {
    return (
      <ThemeProvider>
        <BiometricLock onUnlock={() => setIsLocked(false)} />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={common.flex1}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider
            onAuthReady={() => {
              console.log('[App] Auth ready callback fired');
              setAuthReady(true);
            }}
          >
            <ToastProvider>
              <AppNavigator />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
