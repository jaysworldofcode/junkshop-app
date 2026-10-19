import { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { PurchaseItemCard } from '@/components/PurchaseItemCard';
import { ReceiptPrintButton } from '@/components/ReceiptPrintButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatusBadge } from '@/components/StatusBadge';
import { TicketManageSection } from '@/components/TicketManageSection';
import { FONT_SIZE_CAPTION, FONT_SIZE_TITLE, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment';
import type { TicketStatus } from '@/constants/transaction';
import { formatDateLabel } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import type { TicketPerson } from '@/domain/person';
import { sumExpected, type PurchaseDetail } from '@/domain/purchaseHistory';
import { nowIso } from '@/domain/timestamps';
import { paymentBadge } from '@/purchases/purchaseBadges';
import { setPurchaseStatus, updatePurchaseSeller } from '@/purchases/purchaseRepository';
import { usePurchaseDetail } from '@/purchases/usePurchaseDetail';
import { useAppTheme } from '@/theme/useAppTheme';

export function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This purchase could not be opened." />
      </Screen>
    );
  }

  return <PurchaseDetailContent purchaseId={id} />;
}

function PurchaseDetailContent({ purchaseId }: { purchaseId: string }) {
  const { colors } = useAppTheme();
  const { purchase, isLoading, error, reload } = usePurchaseDetail(purchaseId);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !purchase) {
    return (
      <Screen>
        <ErrorBanner message={error ?? 'This purchase could not be found.'} />
      </Screen>
    );
  }

  return <PurchaseDetailView purchase={purchase} onReload={reload} />;
}

function PurchaseDetailView({
  purchase,
  onReload,
}: {
  purchase: PurchaseDetail;
  onReload: () => Promise<void>;
}) {
  const { colors, colorScheme } = useAppTheme();
  const database = useSQLiteContext();
  const expected = useMemo(() => sumExpected(purchase.items), [purchase.items]);
  const payment = paymentBadge(purchase.paymentStatus);

  const onSavePerson = useCallback(
    async (person: TicketPerson) => {
      await updatePurchaseSeller(database, purchase.id, person, nowIso());
      await onReload();
    },
    [database, onReload, purchase.id]
  );

  const onSetStatus = useCallback(
    async (status: TicketStatus) => {
      await setPurchaseStatus(database, purchase.id, status, nowIso());
      await onReload();
    },
    [database, onReload, purchase.id]
  );

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: purchase.purchaseNumber }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroLabel, { color: colors.muted }]}>
            BOUGHT FROM {purchase.sellerName.toUpperCase()}
          </Text>
          <Text style={[styles.heroTotal, { color: colors.text }]}>{formatPeso(purchase.totalAmount)}</Text>
          <View style={styles.heroBadges}>
            {purchase.status === 'cancelled' ? <StatusBadge label="Cancelled" tone="danger" /> : null}
            <StatusBadge label={payment.label} tone={payment.tone} />
          </View>
        </View>

        <ReceiptPrintButton kind="purchase" id={purchase.id} />

        <SectionCard title="Ticket">
          <DetailRow label="Purchase number" value={purchase.purchaseNumber} />
          <DetailRow label="Date" value={formatDateLabel(purchase.purchaseDate)} />
          <DetailRow
            label="Payment"
            value={[payment.label, purchase.paymentMethod ? PAYMENT_METHOD_LABELS[purchase.paymentMethod] : null]
              .filter(Boolean)
              .join(' · ')}
          />
          {purchase.notes ? <DetailRow label="Notes" value={purchase.notes} /> : null}
        </SectionCard>

        <TicketManageSection
          role="seller"
          ticketKind="purchase"
          personId={purchase.sellerId}
          personName={purchase.sellerName}
          status={purchase.status}
          onSavePerson={onSavePerson}
          onSetStatus={onSetStatus}
        />

        <View style={styles.items}>
          <Text accessibilityRole="header" style={[styles.itemsTitle, { color: colors.muted }]}>
            MATERIALS · {purchase.items.length}
          </Text>
          {purchase.items.map((item) => (
            <PurchaseItemCard key={item.id} item={item} />
          ))}
        </View>

        <SectionCard title="Ticket summary">
          <FigureRow label="Purchase total" centavos={purchase.totalAmount} emphasized />
          <FigureRow label="Expected from supplier" centavos={expected.expectedSellTotal} />
          <FigureRow label="Expected profit" centavos={expected.expectedProfit} tone="profit" />
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
  heroBadges: {
    flexDirection: 'row',
    gap: SPACE_SM,
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
});
