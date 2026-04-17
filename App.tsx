import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/store/ThemeContext';
import { AuthProvider } from './src/store/AuthContext';
import { ToastProvider } from './src/store/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/db/database';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BiometricLock } from './src/components/BiometricLock';
import { common } from './src/styles/common';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
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
      }
    };
    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={common.flexCenter}>
        <ActivityIndicator size="large" />
      </View>
    );
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
          <AuthProvider>
            <ToastProvider>
              <AppNavigator />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
