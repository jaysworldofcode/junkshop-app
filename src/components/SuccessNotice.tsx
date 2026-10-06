import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FONT_SIZE_BODY, HIT_SLOP, ICON_SIZE_MD, ICON_SIZE_SM, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { useAppTheme } from '@/theme/useAppTheme';

type SuccessNoticeProps = {
  title: string;
  body: string;
  onDismiss: () => void;
  action?: { label: string; onPress: () => void };
};

export function SuccessNotice({ title, body, onDismiss, action }: SuccessNoticeProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
    >
      <SymbolView
        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
        tintColor={colors.primary}
        size={ICON_SIZE_MD}
      />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.text }]}>{body}</Text>
        {action ? (
          <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={action.onPress}>
            <Text style={[styles.action, { color: colors.primary }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={HIT_SLOP} onPress={onDismiss}>
        <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={colors.muted} size={ICON_SIZE_SM} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE_SM,
  },
  copy: {
    flex: 1,
    gap: SPACE_XS,
  },
  title: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  body: {
    fontSize: FONT_SIZE_BODY - 1,
    lineHeight: 21,
  },
  action: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
    marginTop: SPACE_XS,
  },
});
