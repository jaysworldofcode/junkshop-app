import { StyleSheet, View, type ViewProps } from 'react-native';

import { MAX_CONTENT_WIDTH, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type ScreenProps = ViewProps & {
  padded?: boolean;
};

export function Screen({ children, style, padded = true, ...rest }: ScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, padded && styles.padded, style]} {...rest}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  padded: {
    padding: SPACE_MD,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});
