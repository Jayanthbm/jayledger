import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Colors = {
  light: {
    background: '#F2F2F7', // iOS systemGroupedBackground
    text: '#000000', // iOS label
    textSecondary: '#8E8E93', // iOS secondaryLabel
    primary: '#007AFF', // iOS systemBlue
    card: '#FFFFFF', // iOS secondarySystemGroupedBackground
    border: '#E5E5EA', // iOS separator
    danger: '#FF3B30', // iOS systemRed
    success: '#34C759', // iOS systemGreen
  },
  dark: {
    background: '#000000', // iOS systemBackground (pure OLED black)
    text: '#FFFFFF', // iOS label
    textSecondary: '#8E8E93', // iOS secondaryLabel
    primary: '#0A84FF', // iOS systemBlue (dark mode)
    card: '#1C1C1E', // iOS secondarySystemBackground
    border: '#2C2C2E', // iOS separator
    danger: '#FF453A', // iOS systemRed (dark mode)
    success: '#30D158', // iOS systemGreen (dark mode)
  },
};

interface ThemeContextProps {
  isDark: boolean;
  colors: typeof Colors.light;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
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
