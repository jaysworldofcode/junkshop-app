import { StyleSheet, Text } from 'react-native';

import type { PriceType } from '@/constants/price';
import { FONT_SIZE_CAPTION } from '@/constants/layout';
import { priceDifference, type CurrentPrice } from '@/domain/materialPrice';
import { formatPeso } from '@/domain/money';
import { useAppTheme } from '@/theme/useAppTheme';

type PriceComparisonProps = {
  priceType: PriceType;
  entered: number | null;
  reference: CurrentPrice | null;
  unit: string;
};

/**
 * Paying above the current buy price, or planning to sell below the current
 * sell price, cuts profit, so those directions are shown as a warning.
 */
export function PriceComparison({ priceType, entered, reference, unit }: PriceComparisonProps) {
  const { colors } = useAppTheme();

  if (reference === null) {
    return null;
  }

  const referenceLabel = `Current ${priceType} price ${formatPeso(reference.price)}/${unit}`;
  const difference = priceDifference(entered, reference);

  if (difference === null || difference === 0) {
    return <Text style={[styles.text, { color: colors.muted }]}>{referenceLabel}</Text>;
  }

  const isAbove = difference > 0;
  const lowersProfit = priceType === 'buy' ? isAbove : !isAbove;
  const effect = lowersProfit ? 'less profit' : 'more profit';

  return (
    <Text style={[styles.text, styles.changed, { color: lowersProfit ? colors.warning : colors.primary }]}>
      {formatPeso(Math.abs(difference))}/{unit} {isAbove ? 'above' : 'below'} current {priceType} price ({formatPeso(reference.price)}) · {effect}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
  },
  changed: {
    fontWeight: '700',
  },
});
