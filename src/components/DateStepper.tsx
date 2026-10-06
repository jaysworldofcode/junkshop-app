import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import {
  BUTTON_MIN_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  HIT_SLOP,
  ICON_SIZE_MD,
  RADIUS_MD,
  SPACE_XS,
  SPACE_SM,
} from '@/constants/layout';
import {
  addDays,
  formatDateLabel,
  relativeDayName,
  todayLocalDateKey,
  type LocalDateKey,
} from '@/domain/localDate';
import { useAppTheme } from '@/theme/useAppTheme';

type DateStepperProps = {
  label: string;
  value: LocalDateKey;
  onChange: (value: LocalDateKey) => void;
  disabled?: boolean;
};

export function DateStepper({ label, value, onChange, disabled = false }: DateStepperProps) {
  const { colors } = useAppTheme();
  const today = todayLocalDateKey();
  const canGoForward = value < today;
  const dayName = relativeDayName(value, today);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.row, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <StepButton
          label="Previous day"
          icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          onPress={() => onChange(addDays(value, -1))}
          disabled={disabled}
        />
        <View style={styles.valueBox} accessibilityLiveRegion="polite">
          <Text style={[styles.value, { color: colors.text }]}>{dayName ?? formatDateLabel(value)}</Text>
          {dayName ? <Text style={[styles.subValue, { color: colors.muted }]}>{formatDateLabel(value)}</Text> : null}
        </View>
        <StepButton
          label="Next day"
          icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          onPress={() => onChange(addDays(value, 1))}
          disabled={disabled || !canGoForward}
        />
      </View>
      {value === today ? null : (
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={() => onChange(today)} disabled={disabled}>
          <Text style={[styles.reset, { color: colors.primary }]}>Back to today</Text>
        </Pressable>
      )}
    </View>
  );
}

type StepButtonProps = {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  disabled: boolean;
};

function StepButton({ label, icon, onPress, disabled }: StepButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      <SymbolView name={icon} tintColor={colors.primary} size={ICON_SIZE_MD} />
    </Pressable>
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
  row: {
    minHeight: BUTTON_MIN_HEIGHT + SPACE_XS,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    width: BUTTON_MIN_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE_SM,
  },
  value: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  subValue: {
    fontSize: FONT_SIZE_CAPTION,
  },
  reset: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
});
