import { StyleSheet, Text, View } from 'react-native';

import { DetailRow } from '@/components/DetailRow';
import { FigureRow } from '@/components/FigureRow';
import { StatusBadge } from '@/components/StatusBadge';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, RADIUS_LG, RADIUS_MD, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { formatPeso } from '@/domain/money';
import type { PurchaseDetailItem } from '@/domain/purchaseHistory';
import { formatQuantity } from '@/domain/quantity';
import { itemStatusBadge } from '@/purchases/purchaseBadges';
import { useAppTheme } from '@/theme/useAppTheme';

type PurchaseItemCardProps = {
  item: PurchaseDetailItem;
};

export function PurchaseItemCard({ item }: PurchaseItemCardProps) {
  const { colors } = useAppTheme();
  const status = itemStatusBadge(item.status);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={[styles.name, { color: colors.text }]}>{item.materialName}</Text>
          <Text style={[styles.quantity, { color: colors.muted }]}>
            {formatQuantity(item.quantity)} {item.unit} × {formatPeso(item.unitBuyPrice)}/{item.unit}
          </Text>
        </View>
        <StatusBadge label={status.label} tone={status.tone} />
      </View>

      <View style={[styles.figureBox, { backgroundColor: colors.background }]}>
        <FigureRow label="Purchase total" centavos={item.purchaseTotal} emphasized />
      </View>

      <View style={styles.resale}>
        <Text style={[styles.subheading, { color: colors.muted }]}>SUPPLIER PLAN</Text>
        <DetailRow
          label="Supplier price"
          value={item.supplierPrice === null ? 'Not set' : `${formatPeso(item.supplierPrice)}/${item.unit}`}
        />
        <DetailRow label="Planned buyer" value={item.plannedBuyer ?? 'Not set'} />
      </View>

      <View style={[styles.figureBox, { backgroundColor: colors.background }]}>
        <FigureRow label="Expected from supplier" centavos={item.expectedSellTotal} />
        <FigureRow label="Expected profit" centavos={item.expectedProfit} tone="profit" emphasized />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM + 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE_SM,
  },
  titleBox: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  name: {
    fontSize: FONT_SIZE_BODY + 2,
    fontWeight: '700',
  },
  quantity: {
    fontSize: FONT_SIZE_BODY - 1,
    fontVariant: ['tabular-nums'],
  },
  figureBox: {
    borderRadius: RADIUS_MD,
    padding: SPACE_SM + 4,
    gap: SPACE_SM,
  },
  resale: {
    gap: SPACE_XS + 2,
  },
  subheading: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
