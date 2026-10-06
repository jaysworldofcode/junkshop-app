import { useColorScheme as useSystemColorScheme } from 'react-native';

export function useSystemScheme(): 'light' | 'dark' {
  const scheme = useSystemColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
