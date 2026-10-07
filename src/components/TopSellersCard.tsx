import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '@/components/ErrorBanner';
import { SectionCard } from '@/components/SectionCard';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM } from '@/constants/layout';
import { TOP_SELLERS_LIMIT } from '@/constants/person';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import type { DateRange } from '@/domain/dateRange';
import { formatPeso } from '@/domain/money';
import { useTopSellers } from '@/dashboard/useDashboard';
import { useAppTheme } from '@/theme/useAppTheme';

function ticketCount(count: number): string {
  return `${count} ticket${count === 1 ? '' : 's'}`;
}

/** The people who sold the most scrap to the shop on Buy tickets in the period. */
export function TopSellersCard({ range }: { range: DateRange }) {
  const { colors } = useAppTheme();
  const { data: sellers, isLoading, error } = useTopSellers(range);

  return (
    <SectionCard
      title="Top sellers"
      description={`Up to ${TOP_SELLERS_LIMIT} people who sold the most scrap to the shop in this period. Blank and ${UNKNOWN_PERSON_NAME} sellers are left out.`}
    >
      {error ? <ErrorBanner message={error} /> : null}
      {!sellers && isLoading ? <ActivityIndicator color={colors.primary} /> : null}
      {sellers && sellers.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>No purchases from a named seller in this period.</Text>
      ) : null}
      {sellers?.map((seller, index) => (
        <View
          key={seller.key}
          accessible
          accessibilityLabel={`${index + 1}. ${seller.name}, paid ${formatPeso(seller.purchaseTotal)} over ${ticketCount(seller.purchaseCount)}`}
          style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
        >
          <Text style={[styles.rank, { color: colors.muted }]}>{index + 1}</Text>
          <View style={styles.copy}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
              {seller.name}
            </Text>
            <Text style={[styles.details, { color: colors.muted }]}>{ticketCount(seller.purchaseCount)}</Text>
          </View>
          <Text style={[styles.total, { color: colors.text }]}>{formatPeso(seller.purchaseTotal)}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: FONT_SIZE_BODY - 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
    paddingVertical: SPACE_SM,
  },
  rank: {
    width: 22,
    fontSize: FONT_SIZE_BODY,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  copy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  name: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  details: {
    fontSize: FONT_SIZE_CAPTION,
  },
  total: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
