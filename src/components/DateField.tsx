// iOS and Android version. The web version is DateField.web.tsx; keep both in sync.
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';

import { PrimaryButton } from '@/components/PrimaryButton';
import { DATE_PICKER_BACKDROP_COLOR, TYPED_DATE_MAX_LENGTH, TYPED_DATE_PLACEHOLDER } from '@/constants/dateRange';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  HIT_SLOP,
  ICON_SIZE_MD,
  INPUT_MIN_HEIGHT,
  RADIUS_LG,
  RADIUS_MD,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
  SPACE_LG,
} from '@/constants/layout';
import {
  formatDateLabel,
  formatTypedDate,
  parseLocalDateKey,
  parseTypedDate,
  relativeDayName,
  toLocalDateKey,
  todayLocalDateKey,
  type LocalDateKey,
} from '@/domain/localDate';
import { useAppTheme } from '@/theme/useAppTheme';

export type DateFieldProps = {
  label: string;
  value: LocalDateKey;
  onChange: (value: LocalDateKey) => void;
  /** Latest day that can be picked. Defaults to today. */
  maxDate?: LocalDateKey;
  disabled?: boolean;
};

export function DateField({ label, value, onChange, maxDate, disabled = false }: DateFieldProps) {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const latest = maxDate ?? today;
  const [typed, setTyped] = useState(formatTypedDate(value));
  const [typedFor, setTypedFor] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isIosPickerOpen, setIsIosPickerOpen] = useState(false);
  const dayName = relativeDayName(value, today);

  if (typedFor !== value) {
    setTypedFor(value);
    setTyped(formatTypedDate(value));
    setError(null);
  }

  const commitTyped = () => {
    const parsed = parseTypedDate(typed);
    if (!parsed) {
      setError(`Type the date as ${TYPED_DATE_PLACEHOLDER}.`);
      return;
    }
    if (parsed > latest) {
      setError(`Pick ${formatDateLabel(latest)} or earlier.`);
      return;
    }
    setError(null);
    onChange(parsed);
  };

  const openCalendar = () => {
    // Android shows the system date dialog; iOS has no dialog, so it shows an inline calendar in a sheet.
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: parseLocalDateKey(value),
        maximumDate: parseLocalDateKey(latest),
        onValueChange: (_event, date) => onChange(toLocalDateKey(date)),
      });
      return;
    }
    setIsIosPickerOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: colors.background, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <TextInput
          accessibilityLabel={`${label} date`}
          accessibilityHint={`Type the date as ${TYPED_DATE_PLACEHOLDER}`}
          value={typed}
          onChangeText={setTyped}
          onBlur={commitTyped}
          onSubmitEditing={commitTyped}
          placeholder={TYPED_DATE_PLACEHOLDER}
          placeholderTextColor={colors.inactive}
          keyboardType="numbers-and-punctuation"
          keyboardAppearance={colorScheme}
          returnKeyType="done"
          maxLength={TYPED_DATE_MAX_LENGTH}
          editable={!disabled}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose ${label.toLowerCase()} date from a calendar`}
          disabled={disabled}
          hitSlop={HIT_SLOP}
          onPress={openCalendar}
          style={({ pressed }) => [styles.calendarButton, { opacity: disabled ? 0.3 : pressed ? 0.6 : 1 }]}
        >
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            tintColor={colors.primary}
            size={ICON_SIZE_MD}
          />
        </Pressable>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.caption, { color: error ? colors.danger : colors.muted }]}
      >
        {error ?? (dayName ? `${dayName} · ${formatDateLabel(value)}` : formatDateLabel(value))}
      </Text>

      {/* iOS only: Android uses the system dialog opened above. */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={isIosPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsIosPickerOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setIsIosPickerOpen(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <RNDateTimePicker
                mode="date"
                display="inline"
                value={parseLocalDateKey(value)}
                maximumDate={parseLocalDateKey(latest)}
                accentColor={colors.primary}
                themeVariant={colorScheme}
                onValueChange={(_event, date) => onChange(toLocalDateKey(date))}
              />
              <PrimaryButton label="Done" onPress={() => setIsIosPickerOpen(false)} />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
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
  inputBox: {
    minHeight: INPUT_MIN_HEIGHT + 4,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    paddingLeft: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: INPUT_MIN_HEIGHT,
    fontSize: FONT_SIZE_BODY + 1,
    fontVariant: ['tabular-nums'],
  },
  calendarButton: {
    width: INPUT_MIN_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACE_LG,
    backgroundColor: DATE_PICKER_BACKDROP_COLOR,
  },
  sheet: {
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM,
  },
});
