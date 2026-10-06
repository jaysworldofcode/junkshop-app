import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { BUTTON_MIN_HEIGHT, FONT_SIZE_BODY, ICON_SIZE_MD, RADIUS_MD, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: SymbolViewProps['name'];
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  isLoading?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'solid',
  disabled = false,
  isLoading = false,
}: PrimaryButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || isLoading;
  const isSolid = variant === 'solid';
  const foreground = isSolid ? colors.primaryContrast : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSolid
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5 },
        { opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? <SymbolView name={icon} tintColor={foreground} size={ICON_SIZE_MD} /> : null}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: BUTTON_MIN_HEIGHT + SPACE_SM,
    borderRadius: RADIUS_MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_SM,
    paddingHorizontal: SPACE_MD,
  },
  label: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
});
