import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import {
  AVATAR_SIZE,
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  ICON_SIZE_SM,
  RADIUS_LG,
  RADIUS_PILL,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import type { ProductPrices } from '@/domain/materialPrice';
import { formatPeso } from '@/domain/money';
import type { Product } from '@/domain/product';
import { useAppTheme } from '@/theme/useAppTheme';

type ProductListItemProps = {
  product: Product;
  prices: ProductPrices;
  onPress: (product: Product) => void;
};

function priceSummary(prices: ProductPrices): string | null {
  const parts = [
    prices.buy ? `Buy ${formatPeso(prices.buy.price)}` : null,
    prices.sell ? `Sell ${formatPeso(prices.sell.price)}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export const ProductListItem = memo(function ProductListItem({ product, prices, onPress }: ProductListItemProps) {
  const { colors } = useAppTheme();
  const details = [product.code, product.category].filter(Boolean).join(' · ');
  const statusLabel = product.isActive ? 'Active' : 'Turned off';
  const pricesLabel = priceSummary(prices);
  const isMissingPrice = product.isActive && (prices.buy === null || prices.sell === null);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, per ${product.unit}, ${statusLabel}`}
      accessibilityHint="Opens the product to edit"
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          { backgroundColor: product.isActive ? colors.primarySoft : colors.overlay },
        ]}
      >
        <Text style={[styles.avatarLabel, { color: product.isActive ? colors.primary : colors.inactive }]}>
          {product.name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: product.isActive ? colors.text : colors.muted }]}
        >
          {product.name}
        </Text>
        {details ? (
          <Text numberOfLines={1} style={[styles.details, { color: colors.muted }]}>
            {details}
          </Text>
        ) : null}
        {pricesLabel ? (
          <Text numberOfLines={1} style={[styles.prices, { color: colors.text }]}>
            {pricesLabel}
          </Text>
        ) : null}
        {isMissingPrice ? (
          <Text style={[styles.offLabel, { color: colors.warning }]}>Price not set</Text>
        ) : null}
        {product.isActive ? null : (
          <Text style={[styles.offLabel, { color: colors.inactive }]}>Hidden from new purchases</Text>
        )}
      </View>

      <View style={[styles.unitPill, { backgroundColor: colors.overlay }]}>
        <Text style={[styles.unitLabel, { color: colors.text }]}>per {product.unit}</Text>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        tintColor={colors.inactive}
        size={ICON_SIZE_SM}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    paddingVertical: SPACE_SM + 4,
    paddingHorizontal: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM + 4,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontSize: FONT_SIZE_BODY + 2,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  name: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  details: {
    fontSize: FONT_SIZE_CAPTION,
  },
  prices: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  offLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontStyle: 'italic',
  },
  unitPill: {
    borderRadius: RADIUS_PILL,
    paddingHorizontal: SPACE_SM + 2,
    paddingVertical: SPACE_XS,
  },
  unitLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
});
