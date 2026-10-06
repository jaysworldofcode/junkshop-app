import { Stack } from 'expo-router';

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useAppTheme } from '@/theme/useAppTheme';

export default function HistoryLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Purchase history',
          headerRight: () => <ThemeToggleButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Purchase' }} />
    </Stack>
  );
}
