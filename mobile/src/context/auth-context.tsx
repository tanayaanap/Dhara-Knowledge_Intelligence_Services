import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { User } from '@/types/api';
import { clearCachedUser, clearSessionCookie, getCachedUser, setCachedUser } from '@/services/session-store';
import * as api from '@/services/api';
import { queryClient } from '@/services/query-client';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; location?: string; land_size?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = await api.getCurrentUser();

      setUser(current);

      if (current) {
        await setCachedUser(current);
      } else {
        await clearCachedUser();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);

      setUser(null);
      await clearCachedUser();
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const cached = await getCachedUser<User>();

        if (mounted && cached) {
          setUser(cached);
        }

        await refreshUser();
      } catch (error) {
        console.error('AUTH STARTUP ERROR:', error);

        // Don't let authentication failure prevent the app from loading.
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (input) => {
      const result = await api.login(input);
      if (!result.success || !result.user) throw new Error(result.error || 'Invalid credentials');
      setUser(result.user);
      await setCachedUser(result.user);
      router.replace('/');
    },
    signUp: async (input) => {
      const result = await api.register(input);
      if (!result.success) throw new Error(result.error || 'Registration failed');
      router.replace('/login');
    },
    refreshUser,
    signOut: async () => {
      try {
        await api.logout();
      } finally {
        await clearSessionCookie();
        await clearCachedUser();
        queryClient.clear();
        setUser(null);
        router.replace('/');
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
