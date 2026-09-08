import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context/auth-context';
import { LocaleProvider } from '@/i18n';
import { queryClient } from '@/services/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }} />
          </ThemeProvider>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}