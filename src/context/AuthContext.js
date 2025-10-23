import React, { createContext, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const loadUser = async () => {
         try {
            const savedUser = await AsyncStorage.getItem('user');
            if (savedUser) setUser(JSON.parse(savedUser));
         } catch (e) {
            console.warn('Failed to load user from AsyncStorage:', e);
         } finally {
            setLoading(false);
         }
      };

      loadUser();
   }, []);

   const login = async (userData) => {
      try {
         setUser(userData);
         await AsyncStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
         console.warn('Failed to save user:', e);
      }
   };

   const logout = async () => {
      try {
         setUser(null);
         await AsyncStorage.removeItem('user');
      } catch (e) {
         console.warn('Failed to remove user:', e);
      }
   };

   return (
      <AuthContext.Provider value={{ user, loading, login, logout }}>
         {children}
      </AuthContext.Provider>
   );
};

export const useAuth = () => useContext(AuthContext);
