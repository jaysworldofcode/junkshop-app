import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import type { PriceType } from '@/constants/price';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, RADIUS_LG, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import type { LocalDateKey } from '@/domain/localDate';
import { priceSinceLabel, type PriceInputErrors, type PriceInputs, type ProductPrices } from '@/domain/materialPrice';
import type { ProductWithUsage } from '@/domain/product';
import { useAppTheme } from '@/theme/useAppTheme';

type PriceRowProps = {
  product: ProductWithUsage;
  prices: ProductPrices;
  inputs: PriceInputs;
  errors: PriceInputErrors | undefined;
  today: LocalDateKey;
  disabled: boolean;
  onChange: (materialId: string, priceType: PriceType, value: string) => void;
};

export const PriceRow = memo(function PriceRow({
  product,
  prices,
  inputs,
  errors,
  today,
  disabled,
  onChange,
}: PriceRowProps) {
  const { colors } = useAppTheme();
  const hasNoPrice = prices.buy === null || prices.sell === null;
  const perUnit = `/${product.unit}`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
        {hasNoPrice ? <Text style={[styles.badge, { color: colors.warning }]}>Price not set</Text> : null}
      </View>
      {product.purchaseCount > 0 ? (
        <Text style={[styles.usage, { color: colors.muted }]}>
          Bought {product.purchaseCount} time{product.purchaseCount === 1 ? '' : 's'}
        </Text>
      ) : null}
      <View style={styles.pair}>
        <View style={styles.pairItem}>
          <FormField
            label="Buy price"
            placeholder="0.00"
            prefix="₱"
            suffix={perUnit}
            hint={priceSinceLabel(prices.buy, today)}
            value={inputs.buy}
            onChangeText={(value) => onChange(product.id, 'buy', value)}
            error={errors?.buy}
            keyboardType="decimal-pad"
            inputMode="decimal"
            editable={!disabled}
          />
        </View>
        <View style={styles.pairItem}>
          <FormField
            label="Sell price"
            placeholder="0.00"
            prefix="₱"
            suffix={perUnit}
            hint={priceSinceLabel(prices.sell, today)}
            value={inputs.sell}
            onChangeText={(value) => onChange(product.id, 'sell', value)}
            error={errors?.sell}
            keyboardType="decimal-pad"
            inputMode="decimal"
            editable={!disabled}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACE_SM,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  badge: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
  usage: {
    fontSize: FONT_SIZE_CAPTION,
    marginTop: -SPACE_XS,
  },
  pair: {
    flexDirection: 'row',
    gap: SPACE_SM + 4,
  },
  pairItem: {
    flex: 1,
  },
});
