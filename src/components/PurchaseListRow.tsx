import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { StatusBadge } from '@/components/StatusBadge';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  ICON_SIZE_SM,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { formatPeso } from '@/domain/money';
import type { PurchaseListEntry } from '@/domain/purchaseHistory';
import { paymentBadge } from '@/purchases/purchaseBadges';
import { useAppTheme } from '@/theme/useAppTheme';

type PurchaseListRowProps = {
  purchase: PurchaseListEntry;
  onPress: (purchase: PurchaseListEntry) => void;
};

function unsoldLabel(purchase: PurchaseListEntry): string {
  if (purchase.unsoldLineCount === 0) {
    return 'All sold';
  }

  return purchase.unsoldLineCount === purchase.lineCount
    ? 'Unsold'
    : `${purchase.unsoldLineCount} of ${purchase.lineCount} unsold`;
}

export const PurchaseListRow = memo(function PurchaseListRow({ purchase, onPress }: PurchaseListRowProps) {
  const { colors } = useAppTheme();
  const payment = paymentBadge(purchase.paymentStatus);
  const hasUnsold = purchase.unsoldLineCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${purchase.purchaseNumber}, ${purchase.sellerName}, ${formatPeso(purchase.totalAmount)}, ${unsoldLabel(purchase)}`}
      accessibilityHint="Opens the purchase"
      onPress={() => onPress(purchase)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={[styles.seller, { color: colors.text }]}>
            {purchase.sellerName}
          </Text>
          <Text style={[styles.total, { color: colors.text }]}>{formatPeso(purchase.totalAmount)}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.materials, { color: colors.muted }]}>
          {purchase.purchaseNumber} · {purchase.materialNames.join(', ')}
        </Text>
        <View style={styles.badges}>
          <StatusBadge label={unsoldLabel(purchase)} tone={hasUnsold ? 'warning' : 'success'} />
          <StatusBadge label={payment.label} tone={payment.tone} />
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
  seller: {
    flex: 1,
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  total: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  materials: {
    fontSize: FONT_SIZE_CAPTION,
  },
  badges: {
    flexDirection: 'row',
    gap: SPACE_XS + 2,
    marginTop: SPACE_XS / 2,
  },
});
