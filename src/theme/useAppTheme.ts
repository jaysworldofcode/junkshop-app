import { createContext, useContext } from 'react';

import { LIGHT_COLORS, type ColorScheme, type ThemeColors, type ThemePreference } from '@/theme/colors';

export type AppTheme = {
  colors: ThemeColors;
  colorScheme: ColorScheme;
  preference: ThemePreference;
  cyclePreference: () => void;
};

export const AppThemeContext = createContext<AppTheme>({
  colors: LIGHT_COLORS,
  colorScheme: 'light',
  preference: 'system',
  cyclePreference: () => {},
});

export function useAppTheme(): AppTheme {
  return useContext(AppThemeContext);
}
