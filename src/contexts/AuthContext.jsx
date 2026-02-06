import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription = null;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession().catch((err) => {
          console.error('Supabase getSession error:', err);
          return { data: { session: null }, error: err };
        });

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
        }

        if (session) {
          loadUser();
        }

        if (mounted) {
          const {
            data: { subscription: authSubscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            if (session) {
              loadUser();
            } else {
              setUser(null);
            }
          });
          subscription = authSubscription;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

