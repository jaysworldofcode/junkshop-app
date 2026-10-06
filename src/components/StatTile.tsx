import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_CAPTION, FONT_SIZE_TITLE, RADIUS_LG, SPACE_XS, SPACE_MD } from '@/constants/layout';
import { formatPeso } from '@/domain/money';
import { useAppTheme } from '@/theme/useAppTheme';

type StatTileProps = {
  label: string;
  centavos: number;
  caption: string;
};

export function StatTile({ label, centavos, caption }: StatTileProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${formatPeso(centavos)}, ${caption}`}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatPeso(centavos)}
      </Text>
      <Text style={[styles.caption, { color: colors.muted }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_XS,
  },
  label: {
    fontSize: FONT_SIZE_CAPTION - 1,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
  },
});
