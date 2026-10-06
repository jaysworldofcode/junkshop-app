import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_CAPTION, RADIUS_LG, SPACE_XS, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.muted }]}>
          {title.toUpperCase()}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
        ) : null}
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACE_XS * 2,
  },
  heading: {
    gap: SPACE_XS,
    paddingHorizontal: SPACE_XS,
  },
  title: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_MD,
  },
});
