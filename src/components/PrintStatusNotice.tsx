import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { FONT_SIZE_BODY, HIT_SLOP, RADIUS_MD, SPACE_SM, SPACE_MD } from '@/constants/layout';
import type { PrintStatus } from '@/printing/useReceiptPrinter';
import { useAppTheme } from '@/theme/useAppTheme';

type PrintStatusNoticeProps = {
  status: PrintStatus;
  onPrint: () => void;
};

/** Shows a "Print receipt" button until something is printed, then the result with a way to print again. */
export function PrintStatusNotice({ status, onPrint }: PrintStatusNoticeProps) {
  const { colors } = useAppTheme();

  if (status.state === 'idle') {
    return (
      <PrimaryButton
        label="Print receipt"
        variant="outline"
        icon={{ ios: 'printer.fill', android: 'print', web: 'print' }}
        onPress={onPrint}
      />
    );
  }

  const isFailed = status.state === 'failed';
  const actionLabel = isFailed ? 'Try again' : status.state === 'printed' ? 'Print again' : null;
  const message =
    status.state === 'printing'
      ? 'Printing receipt…'
      : status.state === 'printed'
        ? 'Receipt printed.'
        : `Receipt not printed. ${status.message}`;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.notice,
        { backgroundColor: isFailed ? colors.overlay : colors.surface, borderColor: isFailed ? colors.danger : colors.border },
      ]}
    >
      {status.state === 'printing' ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={[styles.text, { color: isFailed ? colors.danger : colors.text }]}>{message}</Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={onPrint}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    padding: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  text: {
    flex: 1,
    fontSize: FONT_SIZE_BODY - 1,
  },
  action: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
});
