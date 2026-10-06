export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryContrast: string;
  primarySoft: string;
  danger: string;
  warning: string;
  warningSoft: string;
  border: string;
  overlay: string;
  inactive: string;
};

export const LIGHT_COLORS: ThemeColors = {
  background: '#F4F1EA',
  surface: '#FFFFFF',
  text: '#1C1917',
  muted: '#78716C',
  primary: '#1F6B4A',
  primaryContrast: '#F8FAF8',
  primarySoft: '#E3F0E8',
  danger: '#B42318',
  warning: '#92400E',
  warningSoft: '#FEF3C7',
  border: '#D6D3D1',
  overlay: '#E7E5E4',
  inactive: '#A8A29E',
};

export const DARK_COLORS: ThemeColors = {
  background: '#121110',
  surface: '#1C1917',
  text: '#F5F5F4',
  muted: '#A8A29E',
  primary: '#4ADE80',
  primaryContrast: '#052E16',
  primarySoft: '#143323',
  danger: '#F87171',
  warning: '#FCD34D',
  warningSoft: '#3A2A0A',
  border: '#44403C',
  overlay: '#292524',
  inactive: '#78716C',
};

export const THEME_COLORS: Record<ColorScheme, ThemeColors> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};
