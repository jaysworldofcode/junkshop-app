import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  INPUT_MIN_HEIGHT,
  RADIUS_MD,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type FormFieldProps = TextInputProps & {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
};

export function FormField({
  label,
  required = false,
  hint,
  error,
  prefix,
  suffix,
  style,
  ...inputProps
}: FormFieldProps) {
  const { colors, colorScheme } = useAppTheme();
  const fieldId = label.replaceAll(' ', '-').toLowerCase();

  return (
    <View style={styles.container}>
      <Text nativeID={`${fieldId}-label`} style={[styles.label, { color: colors.text }]}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        {prefix ? <Text style={[styles.affix, { color: colors.muted }]}>{prefix}</Text> : null}
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${fieldId}-label`}
          placeholderTextColor={colors.inactive}
          keyboardAppearance={colorScheme}
          style={[styles.input, { color: colors.text }, style]}
        />
        {suffix ? <Text style={[styles.affix, { color: colors.muted }]}>{suffix}</Text> : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.caption, { color: colors.muted }]}>{hint}</Text>
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
    paddingHorizontal: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  input: {
    flex: 1,
    minHeight: INPUT_MIN_HEIGHT,
    fontSize: FONT_SIZE_BODY + 1,
  },
  affix: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
  },
});
