import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Colors = {
  light: {
    background: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#3B82F6',
    card: '#F3F4F6',
    border: '#E5E7EB',
    danger: '#EF4444',
    success: '#10B981',
  },
  dark: {
    background: '#111827',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    card: '#1F2937',
    border: '#374151',
    danger: '#EF4444',
    success: '#10B981',
  }
};

interface ThemeContextProps {
  isDark: boolean;
  colors: typeof Colors.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDark: false,
  colors: Colors.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('app_theme');
      if (stored) {
        setIsDark(stored === 'dark');
      } else {
        const sys = Appearance.getColorScheme();
        setIsDark(sys === 'dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');
  };

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
