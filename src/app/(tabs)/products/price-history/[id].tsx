import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { PRICE_TYPE_LABELS, PRICE_TYPES, TICKET_PRICE_DAY_LIMIT } from '@/constants/price';
import { formatDateLabel, todayLocalDateKey } from '@/domain/localDate';
import { priceSinceLabel } from '@/domain/materialPrice';
import { formatPeso } from '@/domain/money';
import type { PriceChangeEntry, TicketPriceDay } from '@/domain/priceHistory';
import { formatQuantity } from '@/domain/quantity';
import { usePriceHistory } from '@/products/usePriceHistory';
import { useAppTheme } from '@/theme/useAppTheme';

export default function PriceHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <Screen>
        <ErrorBanner message="This price history could not be opened." />
      </Screen>
    );
  }

  return <PriceHistoryContent materialId={id} />;
}

function PriceHistoryContent({ materialId }: { materialId: string }) {
  const { colors, colorScheme } = useAppTheme();
  const { data, isLoading, error } = usePriceHistory(materialId);
  const today = todayLocalDateKey();

  if (isLoading && !data) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !data?.product) {
    return (
      <Screen>
        <ErrorBanner message={error ?? 'This product could not be found.'} />
      </Screen>
    );
  }

  const { product, current, changes, ticketDays } = data;
  const perUnit = `/${product.unit}`;

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: `${product.name} prices` }} />
      <ScrollView contentContainerStyle={styles.content} indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
        <SectionCard title="Current prices">
          {PRICE_TYPES.map((priceType) => (
            <View key={priceType} style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{PRICE_TYPE_LABELS[priceType]}</Text>
                <Text style={[styles.rowCaption, { color: colors.muted }]}>
                  {priceSinceLabel(current[priceType], today)}
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: current[priceType] ? colors.text : colors.inactive }]}>
                {current[priceType] ? `${formatPeso(current[priceType].price)}${perUnit}` : 'Not set'}
              </Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Price changes" description="A row is added only when you change a price.">
          {changes.length === 0 ? (
            <Text style={[styles.rowCaption, { color: colors.muted }]}>No prices set yet.</Text>
          ) : (
            changes.map((change) => <PriceChangeRow key={change.id} change={change} perUnit={perUnit} />)
          )}
        </SectionCard>

        <SectionCard
          title="Prices on tickets"
          description={`Average price actually paid and received per day, weighted by quantity. Last ${TICKET_PRICE_DAY_LIMIT} days with tickets.`}
        >
          {ticketDays.length === 0 ? (
            <EmptyState title="No tickets yet" body={`Buys and sales of ${product.name} will show here.`} />
          ) : (
            ticketDays.map((day) => <TicketDayRow key={day.date} day={day} unit={product.unit} />)
          )}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function PriceChangeRow({ change, perUnit }: { change: PriceChangeEntry; perUnit: string }) {
  const { colors } = useAppTheme();
  const difference = change.previousPrice === null ? null : change.price - change.previousPrice;

  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{PRICE_TYPE_LABELS[change.priceType]}</Text>
        <Text style={[styles.rowCaption, { color: colors.muted }]}>{formatDateLabel(change.effectiveDate)}</Text>
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.rowValue, { color: colors.text }]}>
          {formatPeso(change.price)}
          {perUnit}
        </Text>
        <Text style={[styles.rowCaption, { color: colors.muted }]}>
          {difference === null
            ? 'First price'
            : difference === 0
              ? 'Same as before'
              : `${difference > 0 ? '▲' : '▼'} ${formatPeso(Math.abs(difference))} from ${formatPeso(change.previousPrice ?? 0)}`}
        </Text>
      </View>
    </View>
  );
}

function TicketDayRow({ day, unit }: { day: TicketPriceDay; unit: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.dayRow}>
      <Text style={[styles.rowTitle, { color: colors.text }]}>{formatDateLabel(day.date)}</Text>
      <View style={styles.dayFigures}>
        <Text style={[styles.rowCaption, { color: colors.muted }]}>
          Bought {day.averageBuyPrice === null ? '—' : `${formatPeso(day.averageBuyPrice)}/${unit}`}
          {day.quantityBought > 0 ? ` · ${formatQuantity(day.quantityBought)} ${unit}` : ''}
        </Text>
        <Text style={[styles.rowCaption, { color: colors.muted }]}>
          Sold {day.averageSellPrice === null ? '—' : `${formatPeso(day.averageSellPrice)}/${unit}`}
          {day.quantitySold > 0 ? ` · ${formatQuantity(day.quantitySold)} ${unit}` : ''}
        </Text>
      </View>
    </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  rowCopy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  rowEnd: {
    alignItems: 'flex-end',
    gap: SPACE_XS / 2,
  },
  rowTitle: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
  rowCaption: {
    fontSize: FONT_SIZE_CAPTION,
    fontVariant: ['tabular-nums'],
  },
  rowValue: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  dayRow: {
    gap: SPACE_XS,
  },
  dayFigures: {
    gap: SPACE_XS / 2,
  },
});
