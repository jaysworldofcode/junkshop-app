import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, SPACE_SM } from '@/constants/layout';
import { formatPeso } from '@/domain/money';
import { useAppTheme } from '@/theme/useAppTheme';

type FigureRowProps = {
  label: string;
  centavos: number | null;
  tone?: 'plain' | 'profit';
  emphasized?: boolean;
};

const EMPTY_FIGURE = '—';

export function FigureRow({ label, centavos, tone = 'plain', emphasized = false }: FigureRowProps) {
  const { colors } = useAppTheme();
  const valueColor =
    tone === 'profit' && centavos !== null
      ? centavos < 0
        ? colors.danger
        : colors.primary
      : colors.text;

  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${centavos === null ? 'not set' : formatPeso(centavos)}`}>
      <Text style={[styles.label, { color: colors.muted }, emphasized && styles.emphasizedLabel]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }, emphasized && styles.emphasizedValue]}>
        {centavos === null ? EMPTY_FIGURE : formatPeso(centavos)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACE_SM,
  },
  label: {
    fontSize: FONT_SIZE_BODY - 1,
  },
  value: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emphasizedLabel: {
    fontWeight: '700',
  },
  emphasizedValue: {
    fontSize: FONT_SIZE_BODY + 3,
  },
});
