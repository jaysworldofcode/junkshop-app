import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FONT_SIZE_BODY, ICON_SIZE_MD, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type WarningNoticeProps = {
  title: string;
  body: string;
  children?: ReactNode;
};

export function WarningNotice({ title, body, children }: WarningNoticeProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}
    >
      <View style={styles.header}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
          tintColor={colors.warning}
          size={ICON_SIZE_MD}
        />
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.warning }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{body}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    gap: SPACE_SM,
  },
  copy: {
    flex: 1,
    gap: SPACE_XS,
  },
  title: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  body: {
    fontSize: FONT_SIZE_BODY - 1,
    lineHeight: 21,
  },
});
