import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import {
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  ICON_SIZE_SM,
  RADIUS_MD,
  RADIUS_PILL,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import {
  TREND_CHART_DOT_SIZE,
  TREND_CHART_HEIGHT,
  TREND_CHART_LABEL_WIDTH,
  TREND_CHART_LINE_WIDTH,
  TREND_CHART_MIN_POINT_SPACING,
  TREND_CHART_X_AXIS_HEIGHT,
  TREND_CHART_Y_AXIS_WIDTH,
  TREND_CHART_Y_TICKS,
  type TrendGranularity,
} from '@/constants/report';
import { formatCompactPeso, formatTrendAxisLabel, labelInterval, niceAxis } from '@/domain/chart';
import { formatPeso } from '@/domain/money';
import type { TrendBucket } from '@/domain/report';
import { useAppTheme } from '@/theme/useAppTheme';

type Series = 'buy' | 'profit' | 'sell';

const SERIES: { key: Series; label: string; value: (bucket: TrendBucket) => number }[] = [
  { key: 'buy', label: 'Buy', value: (bucket) => bucket.purchases },
  { key: 'profit', label: 'Profit', value: (bucket) => bucket.profit },
  { key: 'sell', label: 'Sell', value: (bucket) => bucket.sales },
];

/** Room above the top grid line so a dot at the highest value is not cut off. */
const TOP_PAD = TREND_CHART_DOT_SIZE;
/** Room on each side so the first and last dots and date labels are not cut off. */
const SIDE_PAD = TREND_CHART_LABEL_WIDTH / 2;

type Point = { x: number; y: number };

export function TrendLineChart({ buckets, granularity }: { buckets: TrendBucket[]; granularity: TrendGranularity }) {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const [visible, setVisible] = useState<Record<Series, boolean>>({ buy: true, profit: true, sell: true });
  const [selectedIndex, setSelected] = useState<number | null>(null);

  const seriesColor: Record<Series, string> = {
    buy: colors.chartBuy,
    profit: colors.chartProfit,
    sell: colors.primary,
  };
  const shownSeries = SERIES.filter((series) => visible[series.key]);

  const values = buckets.flatMap((bucket) => shownSeries.map((series) => series.value(bucket)));
  const axis = niceAxis(Math.min(0, ...values), Math.max(0, ...values), TREND_CHART_Y_TICKS);

  const count = buckets.length;
  const selected = selectedIndex !== null && selectedIndex < count ? selectedIndex : null;
  const spacing =
    count > 1 ? Math.max((plotWidth - SIDE_PAD * 2) / (count - 1), TREND_CHART_MIN_POINT_SPACING) : 0;
  const contentWidth = count > 1 ? spacing * (count - 1) + SIDE_PAD * 2 : plotWidth;
  const every = count > 1 ? labelInterval(spacing, TREND_CHART_LABEL_WIDTH) : 1;
  const xAt = (index: number) => (count > 1 ? SIDE_PAD + index * spacing : contentWidth / 2);
  const yAt = (value: number) =>
    TOP_PAD + TREND_CHART_HEIGHT - ((value - axis.min) / (axis.max - axis.min)) * TREND_CHART_HEIGHT;
  const ticks = Array.from({ length: TREND_CHART_Y_TICKS + 1 }, (_, index) => axis.min + axis.step * index);
  const selectedBucket = selected === null ? null : buckets[selected];

  const toggle = (key: Series) => setVisible((current) => ({ ...current, [key]: !current[key] }));

  return (
    <View style={styles.root}>
      <View style={styles.toggles}>
        {SERIES.map((series) => {
          const isOn = visible[series.key];
          const color = seriesColor[series.key];
          return (
            <Pressable
              key={series.key}
              accessibilityRole="switch"
              accessibilityLabel={`${series.label} line`}
              accessibilityState={{ checked: isOn }}
              onPress={() => toggle(series.key)}
              style={({ pressed }) => [
                styles.toggle,
                {
                  borderColor: isOn ? color : colors.border,
                  backgroundColor: isOn ? colors.background : colors.surface,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <SymbolView
                name={
                  isOn
                    ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                    : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
                }
                tintColor={isOn ? color : colors.inactive}
                size={ICON_SIZE_SM}
              />
              <Text numberOfLines={1} style={[styles.toggleLabel, { color: isOn ? colors.text : colors.muted }]}>
                {series.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.readout, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {selectedBucket ? (
          <>
            <Text style={[styles.readoutTitle, { color: colors.text }]}>
              {granularity === 'month'
                ? formatTrendAxisLabel(selectedBucket.key, 'month')
                : granularity === 'week'
                  ? `Week of ${selectedBucket.label}`
                  : selectedBucket.label}
            </Text>
            {shownSeries.map((series) => {
              const value = series.value(selectedBucket);
              return (
                <View key={series.key} style={styles.readoutRow}>
                  <View style={[styles.toggleSwatch, { backgroundColor: seriesColor[series.key] }]} />
                  <Text style={[styles.readoutLabel, { color: colors.muted }]}>{series.label}</Text>
                  <Text style={[styles.readoutValue, { color: value < 0 ? colors.danger : colors.text }]}>
                    {formatPeso(value)}
                  </Text>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={[styles.readoutHint, { color: colors.muted }]}>
            {shownSeries.length === 0
              ? 'Turn on Buy, Profit, or Sell to see a line.'
              : 'Tap a date on the chart to see the amounts.'}
          </Text>
        )}
      </View>

      <View style={styles.chart}>
        <View style={styles.yAxis}>
          {ticks.map((tick) => (
            <Text
              key={tick}
              numberOfLines={1}
              style={[styles.yLabel, { color: colors.muted, top: yAt(tick) - FONT_SIZE_CAPTION / 2 - 2 }]}
            >
              {formatCompactPeso(tick)}
            </Text>
          ))}
        </View>

        <View style={styles.plot} onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}>
          {plotWidth > 0 ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              persistentScrollbar
              showsHorizontalScrollIndicator={contentWidth > plotWidth}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              <View style={{ width: contentWidth, height: TOP_PAD + TREND_CHART_HEIGHT + TREND_CHART_X_AXIS_HEIGHT }}>
                {ticks.map((tick) => (
                  <View
                    key={tick}
                    style={[
                      styles.gridLine,
                      { top: yAt(tick), backgroundColor: tick === 0 ? colors.inactive : colors.border },
                    ]}
                  />
                ))}

                {selected !== null ? (
                  <View
                    style={[styles.cursor, { left: xAt(selected) - StyleSheet.hairlineWidth, backgroundColor: colors.muted }]}
                  />
                ) : null}

                {shownSeries.map((series) => {
                  const points: Point[] = buckets.map((bucket, index) => ({
                    x: xAt(index),
                    y: yAt(series.value(bucket)),
                  }));
                  const color = seriesColor[series.key];
                  return (
                    <View key={series.key} style={StyleSheet.absoluteFill} pointerEvents="none">
                      {points.slice(1).map((point, index) => (
                        <Segment key={index} from={points[index]} to={point} color={color} />
                      ))}
                      {points.map((point, index) => {
                        const size = index === selected ? TREND_CHART_DOT_SIZE + 4 : TREND_CHART_DOT_SIZE;
                        return (
                          <View
                            key={index}
                            style={[
                              styles.dot,
                              {
                                left: point.x - size / 2,
                                top: point.y - size / 2,
                                width: size,
                                height: size,
                                borderRadius: size / 2,
                                backgroundColor: color,
                                borderColor: colors.surface,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  );
                })}

                {buckets.map((bucket, index) =>
                  index % every === 0 ? (
                    <Text
                      key={bucket.key}
                      numberOfLines={2}
                      style={[
                        styles.xLabel,
                        {
                          left: xAt(index) - TREND_CHART_LABEL_WIDTH / 2,
                          color: index === selected ? colors.text : colors.muted,
                        },
                      ]}
                    >
                      {formatTrendAxisLabel(bucket.key, granularity)}
                    </Text>
                  ) : null
                )}

                {buckets.map((bucket, index) => {
                  const width = count > 1 ? spacing : contentWidth;
                  return (
                    <Pressable
                      key={bucket.key}
                      accessibilityRole="button"
                      accessibilityLabel={`${bucket.label}. ${shownSeries
                        .map((series) => `${series.label} ${formatPeso(series.value(bucket))}`)
                        .join(', ')}`}
                      onPress={() => setSelected(selected === index ? null : index)}
                      style={[styles.hitArea, { left: xAt(index) - width / 2, width }]}
                    />
                  );
                })}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Segment({ from, to, color }: { from: Point; to: Point; color: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  return (
    <View
      style={[
        styles.segment,
        {
          left: (from.x + to.x) / 2 - length / 2,
          top: (from.y + to.y) / 2 - TREND_CHART_LINE_WIDTH / 2,
          width: length,
          backgroundColor: color,
          transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACE_MD,
  },
  toggles: {
    flexDirection: 'row',
    gap: SPACE_SM,
  },
  toggle: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE_XS + 2,
    paddingHorizontal: SPACE_SM,
    borderWidth: 1.5,
    borderRadius: RADIUS_PILL,
  },
  toggleSwatch: {
    width: 14,
    height: 4,
    borderRadius: 2,
  },
  toggleLabel: {
    flexShrink: 1,
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
  },
  readout: {
    minHeight: 72,
    justifyContent: 'center',
    gap: SPACE_XS,
    padding: SPACE_SM + 4,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
  },
  readoutTitle: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  readoutLabel: {
    flex: 1,
    fontSize: FONT_SIZE_CAPTION + 1,
  },
  readoutValue: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  readoutHint: {
    fontSize: FONT_SIZE_CAPTION + 1,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
  },
  yAxis: {
    width: TREND_CHART_Y_AXIS_WIDTH,
    height: TOP_PAD + TREND_CHART_HEIGHT + TREND_CHART_X_AXIS_HEIGHT,
  },
  yLabel: {
    position: 'absolute',
    right: SPACE_XS,
    fontSize: FONT_SIZE_CAPTION - 1,
    fontVariant: ['tabular-nums'],
  },
  plot: {
    flex: 1,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  cursor: {
    position: 'absolute',
    top: TOP_PAD,
    width: StyleSheet.hairlineWidth * 2,
    height: TREND_CHART_HEIGHT,
  },
  segment: {
    position: 'absolute',
    height: TREND_CHART_LINE_WIDTH,
    borderRadius: TREND_CHART_LINE_WIDTH / 2,
  },
  dot: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  xLabel: {
    position: 'absolute',
    top: TOP_PAD + TREND_CHART_HEIGHT + SPACE_SM,
    width: TREND_CHART_LABEL_WIDTH,
    textAlign: 'center',
    fontSize: FONT_SIZE_CAPTION - 1,
  },
  hitArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
