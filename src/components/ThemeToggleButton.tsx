import { Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { HIT_SLOP } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

export function ThemeToggleButton() {
  const { colors, preference, cyclePreference } = useAppTheme();
  const iconName =
    preference === 'dark'
      ? { ios: 'moon.fill' as const, android: 'dark_mode' as const, web: 'dark_mode' as const }
      : preference === 'light'
        ? { ios: 'sun.max.fill' as const, android: 'light_mode' as const, web: 'light_mode' as const }
        : { ios: 'circle.lefthalf.filled' as const, android: 'contrast' as const, web: 'contrast' as const };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Theme is ${preference}. Change theme.`}
      hitSlop={HIT_SLOP}
      onPress={cyclePreference}
      style={{ marginRight: 4 }}
    >
      <SymbolView name={iconName} tintColor={colors.text} size={22} />
    </Pressable>
  );
}
