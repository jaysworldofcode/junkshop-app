// Web version. The iOS and Android version is DateField.tsx; keep both in sync.
// The browser's own date input already supports both typing a date and choosing it from a calendar.
import { StyleSheet, Text, View } from 'react-native';

import type { DateFieldProps } from '@/components/DateField';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, INPUT_MIN_HEIGHT, RADIUS_MD, SPACE_XS, SPACE_MD } from '@/constants/layout';
import { formatDateLabel, isLocalDateKey, relativeDayName, todayLocalDateKey } from '@/domain/localDate';
import { useAppTheme } from '@/theme/useAppTheme';

export function DateField({ label, value, onChange, maxDate, disabled = false }: DateFieldProps) {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const latest = maxDate ?? today;
  const dayName = relativeDayName(value, today);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <input
        type="date"
        aria-label={`${label} date`}
        value={value}
        max={latest}
        disabled={disabled}
        // Browsers send an empty value while a typed date is incomplete; wait for a whole, allowed day.
        onChange={(event) => {
          const next = event.target.value;
          if (isLocalDateKey(next) && next <= latest) {
            onChange(next);
          }
        }}
        style={{
          minHeight: INPUT_MIN_HEIGHT + 4,
          boxSizing: 'border-box',
          width: '100%',
          padding: `0 ${SPACE_MD}px`,
          borderRadius: RADIUS_MD,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          color: colors.text,
          colorScheme,
          fontFamily: 'inherit',
          fontSize: FONT_SIZE_BODY + 1,
          accentColor: colors.primary,
        }}
      />
      <Text style={[styles.caption, { color: colors.muted }]}>
        {dayName ? `${dayName} · ${formatDateLabel(value)}` : formatDateLabel(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE_XS + 2,
  },
  label: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
  },
});
