import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT_SIZE_BODY, RADIUS_PILL, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type ChoiceChipsProps<Option extends string> = {
  label: string;
  options: readonly Option[];
  value: string;
  onChange: (value: Option) => void;
  getLabel?: (option: Option) => string;
  disabled?: boolean;
};

const CHIP_MIN_HEIGHT = 40;

export function ChoiceChips<Option extends string>({
  label,
  options,
  value,
  onChange,
  getLabel = (option) => option,
  disabled = false,
}: ChoiceChipsProps<Option>) {
  const { colors } = useAppTheme();
  const normalizedValue = value.trim().toLowerCase();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {options.map((option) => {
        const isSelected = option.toLowerCase() === normalizedValue;

        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={getLabel(option)}
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
                opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.label, { color: isSelected ? colors.primaryContrast : colors.text }]}>
              {getLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE_SM,
  },
  chip: {
    minHeight: CHIP_MIN_HEIGHT,
    minWidth: CHIP_MIN_HEIGHT + SPACE_MD,
    paddingHorizontal: SPACE_MD,
    borderRadius: RADIUS_PILL,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
});
