import { Stack } from 'expo-router';

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useAppTheme } from '@/theme/useAppTheme';

export default function SellLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Sell Scrap',
          headerRight: () => <ThemeToggleButton />,
        }}
      />
    </Stack>
  );
}
