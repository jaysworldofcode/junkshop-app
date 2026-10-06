import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { StatusBadge } from '@/components/StatusBadge';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, ICON_SIZE_SM, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { TRANSACTION_KIND_LABELS } from '@/constants/transaction';
import type { TransactionEntry } from '@/domain/dashboard';
import { formatPeso } from '@/domain/money';
import { paymentBadge } from '@/purchases/purchaseBadges';
import { useAppTheme } from '@/theme/useAppTheme';

type TransactionRowProps = {
  transaction: TransactionEntry;
  onPress: (transaction: TransactionEntry) => void;
};

export const TransactionRow = memo(function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const { colors } = useAppTheme();
  const payment = paymentBadge(transaction.paymentStatus);
  const kindLabel = TRANSACTION_KIND_LABELS[transaction.kind];
  const isSale = transaction.kind === 'sale';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kindLabel} ${transaction.ticketNumber}, ${transaction.personName}, ${formatPeso(transaction.totalAmount)}`}
      accessibilityHint={isSale ? 'Opens the sale' : 'Opens the purchase'}
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={[styles.person, { color: colors.text }]}>
            {transaction.personName}
          </Text>
          <Text style={[styles.total, { color: colors.text }]}>{formatPeso(transaction.totalAmount)}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.details, { color: colors.muted }]}>
          {transaction.ticketNumber} · {transaction.materialNames.join(', ')}
        </Text>
        <View style={styles.bottomLine}>
          <View style={styles.badges}>
            <StatusBadge label={kindLabel} tone={isSale ? 'success' : 'neutral'} />
            <StatusBadge label={payment.label} tone={payment.tone} />
          </View>
          {transaction.profit !== null ? (
            <Text style={[styles.profit, { color: transaction.profit < 0 ? colors.danger : colors.primary }]}>
              Profit {formatPeso(transaction.profit)}
            </Text>
          ) : null}
        </View>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={colors.inactive}
        size={ICON_SIZE_SM}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    paddingVertical: SPACE_SM + 4,
    paddingHorizontal: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  copy: {
    flex: 1,
    gap: SPACE_XS,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACE_SM,
  },
  person: {
    flex: 1,
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  total: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  details: {
    fontSize: FONT_SIZE_CAPTION,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE_SM,
    marginTop: SPACE_XS / 2,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACE_XS + 2,
  },
  profit: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
