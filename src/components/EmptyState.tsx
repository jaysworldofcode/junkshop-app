import { StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AVATAR_SIZE, FONT_SIZE_BODY, FONT_SIZE_TITLE, SPACE_SM, SPACE_LG, SPACE_XL } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: SymbolViewProps['name'];
};

const ICON_CIRCLE_SIZE = AVATAR_SIZE * 1.6;

export function EmptyState({ title, body, icon }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <SymbolView name={icon} tintColor={colors.primary} size={AVATAR_SIZE * 0.8} />
        </View>
      ) : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACE_XL,
    paddingHorizontal: SPACE_LG,
    gap: SPACE_SM,
    alignItems: 'center',
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE_SM,
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: FONT_SIZE_BODY,
    lineHeight: 22,
    textAlign: 'center',
  },
});
