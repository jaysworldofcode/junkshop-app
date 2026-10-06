import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, FONT_SIZE_TITLE, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Screen not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>This screen does not exist.</Text>
        <Link href="/products" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Go to Products</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE_LG,
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
  },
  link: {
    marginTop: SPACE_MD,
    paddingVertical: SPACE_MD,
  },
  linkText: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '600',
  },
});
