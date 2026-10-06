import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

export function DatabaseLoadingScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.muted }]}>Opening the local catalog…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_MD,
  },
  label: {
    fontSize: FONT_SIZE_BODY,
  },
});
