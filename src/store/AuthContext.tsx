import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import { runFullSync } from '../services/syncService';

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Auth] Initializing session...");
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("[Auth] Session initialization timed out. Forcing loading false.");
        setLoading(false);
      }
    }, 7000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      console.log("[Auth] Session fetched:", session?.user?.id ? "Logged In" : "Not Logged In");
      setSession(session);
      setLoading(false);
      if(session?.user?.id) {
         console.log('[Auth] User logged in, skipping boot sync to allow Dashboard to handle logic.');
      }
    }).catch(err => {
      clearTimeout(timeout);
      console.error("[Auth] getSession error:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[Auth] Auth state changed:", _event, session?.user?.id);
      setSession(session);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if(data.session?.user?.id) {
      await runFullSync(data.session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
