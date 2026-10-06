import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { SymbolView } from 'expo-symbols';

import {
  FONT_SIZE_BODY,
  HIT_SLOP,
  ICON_SIZE_SM,
  INPUT_MIN_HEIGHT,
  RADIUS_MD,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type SearchFieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export function SearchField({ value, onChangeText, placeholder, ...rest }: SearchFieldProps) {
  const { colors, colorScheme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        tintColor={colors.muted}
        size={ICON_SIZE_SM}
      />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inactive}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={colorScheme}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={HIT_SLOP}
          onPress={() => onChangeText('')}
        >
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
            tintColor={colors.inactive}
            size={ICON_SIZE_SM}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: INPUT_MIN_HEIGHT,
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
    fontSize: FONT_SIZE_BODY,
  },
});
