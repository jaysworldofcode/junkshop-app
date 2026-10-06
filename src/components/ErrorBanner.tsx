import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.overlay, borderColor: colors.danger }]}
    >
      <Text style={[styles.text, { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: SPACE_SM,
    padding: SPACE_MD,
  },
  text: {
    fontSize: FONT_SIZE_BODY,
  },
});
