import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { DateRangeFilter } from '@/components/DateRangeFilter';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import type { DateRangePreset } from '@/constants/dateRange';
import { EXPENSE_CATEGORY_LABELS } from '@/constants/expense';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  ICON_SIZE_SM,
  RADIUS_PILL,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
  SPACE_LG,
} from '@/constants/layout';
import {
  PERCENT_SCALE,
  REPORT_DEFAULT_PRESET,
  TREND_BAR_HEIGHT,
  TREND_BAR_MIN_PERCENT,
  TREND_GRANULARITY_LABELS,
  type InsightTone,
} from '@/constants/report';
import { formatRangeLabel, rangeForPreset, type DateRange } from '@/domain/dateRange';
import { todayLocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import { formatQuantity } from '@/domain/quantity';
import {
  averageBuyPrice,
  averageSellPrice,
  buildInsights,
  buildTrend,
  formatPercent,
  marginPercent,
  percentChange,
  rankByProfit,
  trendGranularityFor,
  type MaterialPerformance,
  type PersonTotal,
  type ReportData,
} from '@/domain/report';
import { useReport } from '@/reports/useReport';
import { useAppTheme } from '@/theme/useAppTheme';

export default function ReportsScreen() {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const [preset, setPreset] = useState<DateRangePreset>(REPORT_DEFAULT_PRESET);
  const [customRange, setCustomRange] = useState<DateRange>({ from: today, to: today });
  const range = rangeForPreset(preset, today, customRange);
  const { data, isLoading, error } = useReport(range);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content} indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
        <SectionCard title="Period" description={formatRangeLabel(range, today)}>
          <DateRangeFilter
            preset={preset}
            customRange={customRange}
            onChangePreset={setPreset}
            onChangeCustomRange={setCustomRange}
          />
        </SectionCard>

        {error ? <ErrorBanner message={error} /> : null}
        {!data && isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {data ? <ReportBody report={data} today={today} /> : null}
      </ScrollView>
    </Screen>
  );
}

function ReportBody({ report, today }: { report: ReportData; today: string }) {
  const { colors } = useAppTheme();
  const insights = buildInsights(report);
  const granularity = trendGranularityFor(report.range);
  const trend = buildTrend(report.range, report.daily, granularity);
  const trendMax = Math.max(1, ...trend.map((bucket) => Math.max(bucket.sales, bucket.purchases)));
  const ranked = rankByProfit(report.materials);
  const boughtOnly = report.materials.filter((material) => material.quantitySold === 0);
  const { current, previous } = report;

  return (
    <>
      <SectionCard title="Insights" description="Worked out from the tickets and expenses in this period.">
        {insights.map((insight, index) => (
          <InsightRow key={index} tone={insight.tone} text={insight.text} />
        ))}
      </SectionCard>

      <SectionCard
        title="Compared with before"
        description={`Previous period: ${formatRangeLabel(report.previousRange, today)}`}
      >
        <ComparisonRow label="Sales" current={current.saleTotal} previous={previous.saleTotal} />
        <ComparisonRow label="Purchases" current={current.purchaseTotal} previous={previous.purchaseTotal} />
        <ComparisonRow label="Realized profit" current={current.realizedProfit} previous={previous.realizedProfit} />
        <ComparisonRow label="Expenses" current={current.expenseTotal} previous={previous.expenseTotal} lowerIsBetter />
        <ComparisonRow label="Net profit" current={current.netProfit} previous={previous.netProfit} emphasized />
      </SectionCard>

      <SectionCard title={`Trend · ${TREND_GRANULARITY_LABELS[granularity]}`}>
        <View style={styles.legend}>
          <LegendDot color={colors.primary} label="Sales" />
          <LegendDot color={colors.warning} label="Purchases" />
        </View>
        {trend.map((bucket) => (
          <View key={bucket.key} style={styles.trendRow}>
            <View style={styles.trendHeader}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{bucket.label}</Text>
              <Text style={[styles.caption, { color: bucket.netProfit < 0 ? colors.danger : colors.muted }]}>
                Net {formatPeso(bucket.netProfit)}
              </Text>
            </View>
            <Bar value={bucket.sales} max={trendMax} color={colors.primary} />
            <Bar value={bucket.purchases} max={trendMax} color={colors.warning} />
          </View>
        ))}
      </SectionCard>

      <SectionCard
        title="Profit by material"
        description="Cost is the buy price that was current when each sale was made."
      >
        {ranked.length === 0 ? (
          <Text style={[styles.caption, { color: colors.muted }]}>Nothing sold in this period.</Text>
        ) : (
          ranked.map((material) => <MaterialRow key={material.materialId} material={material} />)
        )}
        {boughtOnly.length > 0 ? (
          <Text style={[styles.caption, { color: colors.muted }]}>
            Bought but not sold: {boughtOnly.map((material) => material.name).join(', ')}.
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Top buyers" description="People who bought scrap from you.">
        <PeopleList people={report.topBuyers} emptyText="No sales in this period." />
      </SectionCard>

      <SectionCard title="Top sellers" description="People who sold scrap to you.">
        <PeopleList people={report.topSellers} emptyText="No purchases in this period." />
      </SectionCard>

      <SectionCard title="Expenses by category">
        {report.expensesByCategory.length === 0 ? (
          <Text style={[styles.caption, { color: colors.muted }]}>No expenses in this period.</Text>
        ) : (
          report.expensesByCategory.map((row) => (
            <View key={row.category} style={styles.trendRow}>
              <View style={styles.trendHeader}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{EXPENSE_CATEGORY_LABELS[row.category]}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{formatPeso(row.total)}</Text>
              </View>
              <Bar value={row.total} max={current.expenseTotal} color={colors.danger} />
            </View>
          ))
        )}
      </SectionCard>
    </>
  );
}

const INSIGHT_ICONS: Record<InsightTone, { ios: string; android: string; web: string }> = {
  good: { ios: 'arrow.up.right.circle.fill', android: 'trending_up', web: 'trending_up' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  info: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
};

function InsightRow({ tone, text }: { tone: InsightTone; text: string }) {
  const { colors } = useAppTheme();
  const tint = tone === 'good' ? colors.primary : tone === 'warning' ? colors.warning : colors.muted;

  return (
    <View style={styles.insightRow}>
      <SymbolView
        // Each platform has its own icon set; keep all three names in sync.
        name={INSIGHT_ICONS[tone] as never}
        tintColor={tint}
        size={ICON_SIZE_SM}
      />
      <Text style={[styles.insightText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  lowerIsBetter = false,
  emphasized = false,
}: {
  label: string;
  current: number;
  previous: number;
  lowerIsBetter?: boolean;
  emphasized?: boolean;
}) {
  const { colors } = useAppTheme();
  const change = percentChange(current, previous);
  const improved = lowerIsBetter ? current <= previous : current >= previous;
  const changeText =
    change === null ? (current === 0 ? 'No change' : 'New') : `${change >= 0 ? '▲' : '▼'} ${formatPercent(Math.abs(change))}`;

  return (
    <View style={styles.row}>
      <Text style={[styles.rowTitle, { color: colors.text }, emphasized && styles.emphasized]}>{label}</Text>
      <View style={styles.rowEnd}>
        <Text style={[styles.value, { color: colors.text }, emphasized && styles.emphasized]}>{formatPeso(current)}</Text>
        <Text style={[styles.caption, { color: change === null || change === 0 ? colors.muted : improved ? colors.primary : colors.danger }]}>
          {changeText} · was {formatPeso(previous)}
        </Text>
      </View>
    </View>
  );
}

function MaterialRow({ material }: { material: MaterialPerformance }) {
  const { colors } = useAppTheme();
  const margin = marginPercent(material.profit, material.salesTotal);
  const avgBuy = averageBuyPrice(material);
  const avgSell = averageSellPrice(material);

  return (
    <View style={[styles.materialRow, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{material.name}</Text>
        <Text style={[styles.value, { color: material.profit < 0 ? colors.danger : colors.primary }]}>
          {formatPeso(material.profit)}
        </Text>
      </View>
      <Text style={[styles.caption, { color: colors.muted }]}>
        Sold {formatQuantity(material.quantitySold)} {material.unit} for {formatPeso(material.salesTotal)} · cost{' '}
        {formatPeso(material.costTotal)}
        {margin === null ? '' : ` · margin ${formatPercent(margin)}`}
      </Text>
      <Text style={[styles.caption, { color: colors.muted }]}>
        Avg sold {avgSell === null ? '—' : `${formatPeso(avgSell)}/${material.unit}`} · avg paid{' '}
        {avgBuy === null ? '—' : `${formatPeso(avgBuy)}/${material.unit}`}
        {material.quantityBought > 0 ? ` (${formatQuantity(material.quantityBought)} ${material.unit} bought)` : ''}
      </Text>
    </View>
  );
}

function PeopleList({ people, emptyText }: { people: PersonTotal[]; emptyText: string }) {
  const { colors } = useAppTheme();

  if (people.length === 0) {
    return <Text style={[styles.caption, { color: colors.muted }]}>{emptyText}</Text>;
  }

  return people.map((person) => (
    <View key={person.name} style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{person.name}</Text>
        <Text style={[styles.caption, { color: colors.muted }]}>
          {person.ticketCount} ticket{person.ticketCount === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{formatPeso(person.total)}</Text>
    </View>
  ));
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const { colors } = useAppTheme();
  const percent = max > 0 && value > 0 ? Math.max(TREND_BAR_MIN_PERCENT, (value / max) * PERCENT_SCALE) : 0;

  return (
    <View style={[styles.barTrack, { backgroundColor: colors.overlay }]}>
      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.caption, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  value: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  emphasized: {
    fontSize: FONT_SIZE_BODY + 2,
  },
  caption: {
    fontSize: FONT_SIZE_CAPTION,
    fontVariant: ['tabular-nums'],
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE_SM,
  },
  insightText: {
    flex: 1,
    fontSize: FONT_SIZE_BODY - 1,
    lineHeight: FONT_SIZE_BODY + 6,
  },
  legend: {
    flexDirection: 'row',
    gap: SPACE_MD,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_XS,
  },
  legendDot: {
    width: TREND_BAR_HEIGHT,
    height: TREND_BAR_HEIGHT,
    borderRadius: TREND_BAR_HEIGHT / 2,
  },
  trendRow: {
    gap: SPACE_XS,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACE_SM,
  },
  barTrack: {
    height: TREND_BAR_HEIGHT,
    borderRadius: RADIUS_PILL,
    overflow: 'hidden',
  },
  barFill: {
    height: TREND_BAR_HEIGHT,
    borderRadius: RADIUS_PILL,
  },
  materialRow: {
    gap: SPACE_XS,
    paddingTop: SPACE_SM,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
