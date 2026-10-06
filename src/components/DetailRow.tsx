import { StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, SPACE_SM } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACE_SM,
  },
  label: {
    fontSize: FONT_SIZE_BODY - 1,
  },
  value: {
    flexShrink: 1,
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '600',
    textAlign: 'right',
  },
});
