// supabaseClient.js

import 'react-native-url-polyfill/auto';

import { REACT_APP_SUPABASE_ANON_KEY, REACT_APP_SUPABASE_URL } from "@env";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
   auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
   },
});

export const getSession = async () => {
   const { data, error } = await supabase.auth.getSession();
   if (error) {
      console.error('Error fetching session:', error.message);
   }
   return data.session;
};