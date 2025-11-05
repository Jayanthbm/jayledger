// src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let isMounted = true;
     let subscription;

     const initSession = async () => {
        try {
       // 🟦 Get existing session
       const { data, error } = await supabase.auth.getSession();
       if (error) console.warn('Error getting session:', error.message);

       if (data?.session && isMounted) {
          setUser(data.session.user);
          await AsyncStorage.setItem("user", JSON.stringify(data.session.user));
       } else {
          await AsyncStorage.removeItem("user");
       }

       // 🟦 Listen for auth changes
       const { data: listener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
             if (!isMounted) return;
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
               await AsyncStorage.setItem("user", JSON.stringify(currentUser));
            } else {
               await AsyncStorage.removeItem("user");
            }
         }
      );

       // ✅ assign the correct subscription object
       subscription = listener.subscription;
     } catch (err) {
        console.warn("Auth initialization error:", err);
     } finally {
        if (isMounted) setLoading(false);
     }
  };

     initSession();

     return () => {
        isMounted = false;
        subscription?.unsubscribe(); // ✅ Correct
     };
  }, []);

   // 🔹 Login
   const login = async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
   };

   // 🔹 Register
   const register = async (email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data.user;
   };

   // 🔹 Logout
   const logout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem("user");
   };

   return (
      <AuthContext.Provider value={{ user, loading, login, register, logout }}>
         {children}
      </AuthContext.Provider>
   );
};

export const useAuth = () => useContext(AuthContext);
