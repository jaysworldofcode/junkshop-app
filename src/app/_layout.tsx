import { Suspense, useEffect } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { DatabaseLoadingScreen } from '@/components/DatabaseLoadingScreen';
import { DATABASE_NAME } from '@/constants/database';
import { applyMigrations } from '@/db/migrate';
import { AppThemeProvider } from '@/theme/AppThemeProvider';
import { useAppTheme } from '@/theme/useAppTheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppThemeProvider>
        <Suspense fallback={<DatabaseLoadingScreen />}>
          <SQLiteProvider databaseName={DATABASE_NAME} onInit={applyMigrations} useSuspense>
            <RootNavigation />
          </SQLiteProvider>
        </Suspense>
      </AppThemeProvider>
    </AppErrorBoundary>
  );
}

function RootNavigation() {
  const { colorScheme } = useAppTheme();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
