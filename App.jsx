// App.jsx
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { initDatabase } from './src/database/db';

function AppContent() {
  const { theme } = useTheme();
  return <Text>JayLedger</Text>;
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
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
