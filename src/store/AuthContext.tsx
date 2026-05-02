import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';
import { runFullSync } from '../services/syncService';
import { logger } from '../utils/logger';

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  onAuthReady?: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children, onAuthReady }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Notify parent when auth is ready
  useEffect(() => {
    if (!loading && onAuthReady) {
      onAuthReady();
    }
  }, [loading, onAuthReady]);

  useEffect(() => {
    logger.log('[Auth] Initializing session...');
    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        logger.warn('[Auth] Session initialization timed out. Forcing loading false.');
        setLoading(false);
      }
    }, 7000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        logger.log('[Auth] Session fetched:', session?.user?.id ? 'Logged In' : 'Not Logged In');
        setSession(session);
        setLoading(false);
        if (session?.user?.id) {
          logger.log(
            '[Auth] User logged in, skipping boot sync to allow Dashboard to handle logic.',
          );
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        logger.error('[Auth] getSession error:', err);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.log('[Auth] Auth state changed:', _event, session?.user?.id);
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
    if (data.session?.user?.id) {
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
