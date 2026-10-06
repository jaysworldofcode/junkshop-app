import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { DateRangeFilter } from '@/components/DateRangeFilter';
import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { StatTile } from '@/components/StatTile';
import { DEFAULT_DATE_RANGE_PRESET, type DateRangePreset } from '@/constants/dateRange';
import { FONT_SIZE_CAPTION, FONT_SIZE_DISPLAY, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { usePeriodTotals } from '@/dashboard/useDashboard';
import { formatRangeLabel, rangeForPreset, type DateRange } from '@/domain/dateRange';
import { todayLocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import { useAppTheme } from '@/theme/useAppTheme';

function ticketCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export default function DashboardScreen() {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_DATE_RANGE_PRESET);
  const [customRange, setCustomRange] = useState<DateRange>({ from: today, to: today });
  const range = rangeForPreset(preset, today, customRange);
  const { data, isLoading, error } = usePeriodTotals(range);
  const transactionCount = data ? data.purchaseCount + data.saleCount : 0;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
        <SectionCard title="Period">
          <DateRangeFilter
            preset={preset}
            customRange={customRange}
            onChangePreset={setPreset}
            onChangeCustomRange={setCustomRange}
          />
        </SectionCard>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.heroLabel, { color: colors.muted }]}>{formatRangeLabel(range, today).toUpperCase()}</Text>
          <Text style={[styles.heroCaption, { color: colors.text }]}>Net profit</Text>
          {data ? (
            <>
              <Text style={[styles.heroValue, { color: data.netProfit < 0 ? colors.danger : colors.primary }]}>
                {formatPeso(data.netProfit)}
              </Text>
              <View style={styles.heroFigures}>
                <FigureRow label="Realized profit" centavos={data.realizedProfit} tone="profit" />
                <FigureRow label="Expenses" centavos={-data.expenseTotal} tone="profit" />
              </View>
              <Text style={[styles.heroCaption, { color: colors.muted }]}>
                Profit on {ticketCount(data.saleCount, 'sale')} minus {ticketCount(data.expenseCount, 'expense')}.
              </Text>
            </>
          ) : isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.heroLoading} />
          ) : null}
        </View>

        {data ? (
          <>
            <View style={styles.tiles}>
              <StatTile label="Sales" centavos={data.saleTotal} caption={ticketCount(data.saleCount, 'ticket')} />
              <StatTile
                label="Purchases"
                centavos={data.purchaseTotal}
                caption={ticketCount(data.purchaseCount, 'ticket')}
              />
            </View>

            <SectionCard title="Not fully paid" description="Tickets in this period marked unpaid or partial.">
              <DetailRow label="Sales" value={ticketCount(data.unsettledSales, 'ticket')} />
              <DetailRow label="Purchases" value={ticketCount(data.unsettledPurchases, 'ticket')} />
            </SectionCard>

            <PrimaryButton
              label={transactionCount > 0 ? `View ${ticketCount(transactionCount, 'transaction')}` : 'No transactions yet'}
              variant="outline"
              icon={{ ios: 'list.bullet', android: 'list', web: 'list' }}
              disabled={transactionCount === 0}
              onPress={() => router.push({ pathname: '/home/transactions', params: { from: range.from, to: range.to } })}
            />
            <PrimaryButton
              label="Open reports"
              variant="outline"
              icon={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
              onPress={() => router.push('/home/reports')}
            />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG * 2,
  },
  hero: {
    borderRadius: RADIUS_LG,
    padding: SPACE_LG,
    gap: SPACE_XS,
  },
  heroLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: SPACE_SM,
  },
  heroCaption: {
    fontSize: FONT_SIZE_CAPTION + 1,
  },
  heroValue: {
    fontSize: FONT_SIZE_DISPLAY + 8,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  heroFigures: {
    gap: SPACE_XS,
    marginVertical: SPACE_SM,
  },
  heroLoading: {
    alignSelf: 'flex-start',
    marginVertical: SPACE_SM,
  },
  tiles: {
    flexDirection: 'row',
    gap: SPACE_SM + 4,
  },
});
