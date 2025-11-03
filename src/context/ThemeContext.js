// src/context/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { darkColors, lightColors } from "../theme/colors";

import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
   const [themeMode, setThemeMode] = useState("system");
   const [theme, setTheme] = useState({
      colors:
         Appearance.getColorScheme() === "dark" ? darkColors : lightColors,
      mode: Appearance.getColorScheme() || "light",
   });

   // 🔹 Load saved preference on mount
   useEffect(() => {
      (async () => {
         const saved = await AsyncStorage.getItem("themeMode");
         if (saved) setThemeMode(saved);
      })();
   }, []);

   // 🔹 Respond to system theme changes (if mode = "system")
   useEffect(() => {
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
         if (themeMode === "system") {
            setTheme({
               colors: colorScheme === "dark" ? darkColors : lightColors,
               mode: colorScheme,
            });
         }
      });
      return () => listener.remove();
   }, [themeMode]);

   // 🔹 Apply chosen mode
   useEffect(() => {
      if (themeMode === "system") {
         const sys = Appearance.getColorScheme();
         setTheme({
            colors: sys === "dark" ? darkColors : lightColors,
            mode: sys,
         });
      } else if (themeMode === "light") {
         setTheme({ colors: lightColors, mode: "light" });
      } else {
         setTheme({ colors: darkColors, mode: "dark" });
      }
   }, [themeMode]);

   // 🔹 Manual change (from Settings)
   const toggleTheme = async (mode) => {
      try {
         let parseMode = '';
         let nextMode = mode;

         // if mode is not passed
         if (typeof mode !== 'string') {
            parseMode = themeMode;
            if (parseMode === 'system') {
               parseMode = Appearance.getColorScheme();
            }
            nextMode = parseMode === 'light' ? 'dark' : 'light';
         }
         setThemeMode(nextMode);
         await AsyncStorage.setItem("themeMode", nextMode);

      } catch (error) {
         console.log("Error toggling mode", error)
      }

   };

   return (
      <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
         {children}
      </ThemeContext.Provider>
   );
};

// Hook for convenience
export const useTheme = () => useContext(ThemeContext);
