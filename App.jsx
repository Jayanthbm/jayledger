import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Main from './src/screens/Main';
import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
   return (
      <ThemeProvider>
         <GestureHandlerRootView style={styles.container}>
            <Main />
         </GestureHandlerRootView>

      </ThemeProvider>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1 },
});