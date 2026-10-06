import { Stack } from 'expo-router';

import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useAppTheme } from '@/theme/useAppTheme';

export default function ProductsLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Products',
          headerRight: () => <ThemeToggleButton />,
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Add product' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit product' }} />
      <Stack.Screen name="prices" options={{ title: 'Prices' }} />
    </Stack>
  );
}
