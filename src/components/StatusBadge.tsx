import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_CAPTION, RADIUS_PILL, SPACE_XS, SPACE_SM } from '@/constants/layout';
import type { ThemeColors } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

type StatusBadgeProps = {
  label: string;
  tone: BadgeTone;
};

function toneColors(tone: BadgeTone, colors: ThemeColors): { text: string; background: string } {
  switch (tone) {
    case 'success':
      return { text: colors.primary, background: colors.primarySoft };
    case 'warning':
      return { text: colors.warning, background: colors.warningSoft };
    case 'danger':
      return { text: colors.danger, background: colors.overlay };
    case 'neutral':
      return { text: colors.muted, background: colors.overlay };
  }
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const { colors } = useAppTheme();
  const { text, background } = toneColors(tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS_PILL,
    paddingHorizontal: SPACE_SM + 2,
    paddingVertical: SPACE_XS - 1,
  },
  label: {
    fontSize: FONT_SIZE_CAPTION - 1,
    fontWeight: '800',
  },
});
