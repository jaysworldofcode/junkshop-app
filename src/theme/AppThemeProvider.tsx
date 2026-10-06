import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';

import { THEME_PREFERENCE_KEY } from '@/constants/storage';
import { useSystemScheme } from '@/hooks/useSystemScheme';
import { THEME_COLORS, type ColorScheme, type ThemePreference } from '@/theme/colors';
import { applyCssVariables } from '@/theme/scrollbar';
import { AppThemeContext } from '@/theme/useAppTheme';

const PREFERENCE_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemScheme = useSystemScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    let isCancelled = false;

    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (!isCancelled && isThemePreference(stored)) {
          setPreference(stored);
        }
      } catch {
        // Keep the system default when storage is unavailable.
      }
    }

    void loadPreference();

    return () => {
      isCancelled = true;
    };
  }, []);

  const cyclePreference = useCallback(() => {
    setPreference((current) => {
      const currentIndex = PREFERENCE_ORDER.indexOf(current);
      const next = PREFERENCE_ORDER[(currentIndex + 1) % PREFERENCE_ORDER.length];
      void AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
      return next;
    });
  }, []);

  const colorScheme: ColorScheme = preference === 'system' ? systemScheme : preference;
  const colors = THEME_COLORS[colorScheme];

  useEffect(() => {
    if (Platform.OS === 'web') {
      applyCssVariables(colors);
    }
  }, [colors]);

  const navigationTheme = useMemo(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colorScheme, colors]);

  const value = useMemo(
    () => ({
      colors,
      colorScheme,
      preference,
      cyclePreference,
    }),
    [colorScheme, colors, cyclePreference, preference]
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}
