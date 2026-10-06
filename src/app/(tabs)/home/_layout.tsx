import { Stack } from 'expo-router';

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useAppTheme } from '@/theme/useAppTheme';

export default function HomeLayout() {
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
          title: 'Dashboard',
          headerRight: () => <ThemeToggleButton />,
        }}
      />
      <Stack.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="data" options={{ title: 'Backup & transfer' }} />
      <Stack.Screen name="sale/[id]" options={{ title: 'Sale' }} />
      <Stack.Screen name="purchase/[id]" options={{ title: 'Purchase' }} />
    </Stack>
  );
}
