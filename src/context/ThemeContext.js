import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors } from '../theme/colors';

import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
   // Get system preference
   const colorScheme = Appearance.getColorScheme(); // 'light' or 'dark'

   const [theme, setTheme] = useState({
      colors: colorScheme === 'dark' ? darkColors : lightColors,
      mode: colorScheme || 'light',
   });

   // Listen to system changes dynamically
   useEffect(() => {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
         setTheme({
            colors: colorScheme === 'dark' ? darkColors : lightColors,
            mode: colorScheme || 'light',
         });
      });

      return () => subscription.remove();
   }, []);

   // Optional: manual toggle
   const toggleTheme = () => {
      setTheme((prev) => ({
         colors: prev.mode === 'light' ? darkColors : lightColors,
         mode: prev.mode === 'light' ? 'dark' : 'light',
      }));
   };

   return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
         {children}
      </ThemeContext.Provider>
   );
};

// Hook for convenience
export const useTheme = () => useContext(ThemeContext);
