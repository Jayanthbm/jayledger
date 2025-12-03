import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { useTheme } from '../context/ThemeContext';
import { initDatabase } from '../database/db';
import SplashScreen from '../screens/SplashScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      setDbReady(true);
    };
    init();
  }, []);

  if (loading || !dbReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.onSurface,
          border: theme.colors.outline,
          primary: theme.colors.primary,
          notification: theme.colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          light: { fontFamily: 'System', fontWeight: '300' },
          thin: { fontFamily: 'System', fontWeight: '100' },
        },
      }}
    >
      <SafeAreaView
        style={{ backgroundColor: theme.colors.background, flex: 1 }}
        edges={['top', 'bottom']}
      >
        {user ? <MainStack /> : <AuthStack />}
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default AppNavigator;
