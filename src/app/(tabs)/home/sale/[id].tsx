import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { ReceiptPrintButton } from '@/components/ReceiptPrintButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  FONT_SIZE_TITLE,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
  SPACE_LG,
} from '@/constants/layout';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment';
import { useSaleDetail } from '@/dashboard/useDashboard';
import { sumSaleItems, type SaleDetail } from '@/domain/dashboard';
import { formatDateLabel } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import { formatQuantity } from '@/domain/quantity';
import { paymentBadge } from '@/purchases/purchaseBadges';
import { useAppTheme } from '@/theme/useAppTheme';

export default function SaleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This sale could not be opened." />
      </Screen>
    );
  }

  return <SaleDetailContent saleId={id} />;
}

function SaleDetailContent({ saleId }: { saleId: string }) {
  const { colors } = useAppTheme();
  const { data: sale, isLoading, error } = useSaleDetail(saleId);

  if (isLoading && !sale) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !sale) {
    return (
      <Screen>
        <ErrorBanner message={error ?? 'This sale could not be found.'} />
      </Screen>
    );
  }

  return <SaleDetailView sale={sale} />;
}

function SaleDetailView({ sale }: { sale: SaleDetail }) {
  const { colors, colorScheme } = useAppTheme();
  const payment = paymentBadge(sale.paymentStatus);
  const totals = sumSaleItems(sale.items);

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: sale.saleNumber }} />
      <ScrollView contentContainerStyle={styles.content} indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { color: colors.muted }]}>SOLD TO {sale.buyerName.toUpperCase()}</Text>
          <Text style={[styles.heroTotal, { color: colors.text }]}>{formatPeso(sale.totalAmount)}</Text>
          <StatusBadge label={payment.label} tone={payment.tone} />
        </View>

        <ReceiptPrintButton kind="sale" id={sale.id} />

        <SectionCard title="Ticket">
          <DetailRow label="Sale number" value={sale.saleNumber} />
          <DetailRow label="Date" value={formatDateLabel(sale.saleDate)} />
          <DetailRow label="Buyer" value={sale.buyerName} />
          <DetailRow
            label="Payment"
            value={[payment.label, sale.paymentMethod ? PAYMENT_METHOD_LABELS[sale.paymentMethod] : null]
              .filter(Boolean)
              .join(' · ')}
          />
          {sale.notes ? <DetailRow label="Notes" value={sale.notes} /> : null}
        </SectionCard>

        <View style={styles.items}>
          <Text accessibilityRole="header" style={[styles.itemsTitle, { color: colors.muted }]}>
            MATERIALS · {sale.items.length}
          </Text>
          {sale.items.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.materialName}</Text>
              <Text style={[styles.itemQuantity, { color: colors.muted }]}>
                {formatQuantity(item.quantity)} {item.unit} × {formatPeso(item.unitSellPrice)}/{item.unit}
              </Text>
              <FigureRow label="Sale total" centavos={item.saleTotal} />
              <FigureRow label="Cost at buy price" centavos={item.allocatedPurchaseCost} />
              <FigureRow label="Actual profit" centavos={item.actualProfit} tone="profit" emphasized />
            </View>
          ))}
        </View>

        <SectionCard title="Sale summary">
          <FigureRow label="Sale total" centavos={sale.totalAmount} emphasized />
          <FigureRow label="Cost at buy price" centavos={totals.cost} />
          <FigureRow label="Actual profit" centavos={totals.profit} tone="profit" />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG * 2,
  },
  hero: {
    alignItems: 'center',
    gap: SPACE_SM,
    paddingVertical: SPACE_SM,
  },
  heroLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTotal: {
    fontSize: FONT_SIZE_TITLE + 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  items: {
    gap: SPACE_SM + 4,
  },
  itemsTitle: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: SPACE_XS,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM,
  },
  itemName: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  itemQuantity: {
    fontSize: FONT_SIZE_CAPTION,
    fontVariant: ['tabular-nums'],
  },
});
