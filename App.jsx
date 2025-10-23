import { StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import { AuthProvider } from './src/context/AuthContext'; // ✅ new
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import RootNavigator from './src/navigation/RootNavigator'; // ✅ new

function AppContent() {
   const { theme } = useTheme();
   return (
      <NavigationContainer
         theme={{
            dark: false, // or toggle based on your theme
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
         <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <RootNavigator />
         </View>
      </NavigationContainer>
   );
}
export default function App() {
   return (
      <ThemeProvider>
         <AuthProvider>
            <GestureHandlerRootView style={styles.container}>
               <AppContent />
            </GestureHandlerRootView>
         </AuthProvider>
      </ThemeProvider>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
});
