// App.jsx
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { initDatabase } from './src/database/db';
import { navigationRef } from './src/navigation/NavigationRef';

function AppContent() {
   const { theme } = useTheme();
   return (
      <NavigationContainer
         ref={navigationRef}
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
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            edges={['top', 'bottom']}
         >
            <RootNavigator />
         </SafeAreaView>
      </NavigationContainer>
   );
}

export default function App() {
   useEffect(() => {
      (async () => {
         console.log('🧩 Initializing database...');
         await initDatabase();
         console.log('✅ Database ready');
      })();
   }, []);

   return (
      <GestureHandlerRootView style={styles.container}>
         <SafeAreaProvider>
            <ThemeProvider>
               <AuthProvider>
                  <AppContent />
               </AuthProvider>
            </ThemeProvider>
         </SafeAreaProvider>
      </GestureHandlerRootView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1 },
});
