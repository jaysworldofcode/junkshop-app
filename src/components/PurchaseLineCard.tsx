import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FigureRow } from '@/components/FigureRow';
import { FormField } from '@/components/FormField';
import { PriceComparison } from '@/components/PriceComparison';
import {
  BUTTON_MIN_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  HIT_SLOP,
  ICON_SIZE_MD,
  ICON_SIZE_SM,
  RADIUS_LG,
  RADIUS_MD,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import type { ProductPrices } from '@/domain/materialPrice';
import type { Product } from '@/domain/product';
import type {
  PurchaseLineDraft,
  PurchaseLineErrors,
  PurchaseLineField,
  PurchaseLineFigures,
} from '@/domain/purchase';
import { useAppTheme } from '@/theme/useAppTheme';

type PurchaseLineCardProps = {
  position: number;
  line: PurchaseLineDraft;
  figures: PurchaseLineFigures;
  errors: PurchaseLineErrors | undefined;
  product: Product | undefined;
  prices: ProductPrices;
  canRemove: boolean;
  disabled: boolean;
  onChange: (key: string, field: PurchaseLineField, value: string) => void;
  onRemove: (key: string) => void;
  onPickProduct: (key: string) => void;
};

export const PurchaseLineCard = memo(function PurchaseLineCard({
  position,
  line,
  figures,
  errors,
  product,
  prices,
  canRemove,
  disabled,
  onChange,
  onRemove,
  onPickProduct,
}: PurchaseLineCardProps) {
  const { colors } = useAppTheme();
  const unit = product?.unit ?? 'unit';
  const perUnit = `/${unit}`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.muted }]}>
          MATERIAL {position}
        </Text>
        {canRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove material ${position}`}
            hitSlop={HIT_SLOP}
            disabled={disabled}
            onPress={() => onRemove(line.key)}
            style={styles.removeButton}
          >
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              tintColor={colors.danger}
              size={ICON_SIZE_SM}
            />
            <Text style={[styles.removeLabel, { color: colors.danger }]}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          Product<Text style={{ color: colors.danger }}> *</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={product ? `Product: ${product.name}. Change product` : 'Pick a product'}
          disabled={disabled}
          onPress={() => onPickProduct(line.key)}
          style={({ pressed }) => [
            styles.productButton,
            {
              backgroundColor: product ? colors.primarySoft : colors.background,
              borderColor: errors?.materialId ? colors.danger : product ? colors.primary : colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Text style={[styles.productName, { color: product ? colors.text : colors.inactive }]}>
            {product ? product.name : 'Pick a product'}
          </Text>
          {product ? <Text style={[styles.productUnit, { color: colors.muted }]}>per {product.unit}</Text> : null}
          <SymbolView
            name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
            tintColor={colors.muted}
            size={ICON_SIZE_MD}
          />
        </Pressable>
        {errors?.materialId ? (
          <Text style={[styles.error, { color: colors.danger }]}>{errors.materialId}</Text>
        ) : null}
      </View>

      <View style={styles.pair}>
        <View style={styles.pairItem}>
          <FormField
            label="Quantity"
            required
            placeholder="0"
            suffix={unit}
            value={line.quantity}
            onChangeText={(value) => onChange(line.key, 'quantity', value)}
            error={errors?.quantity}
            keyboardType="decimal-pad"
            inputMode="decimal"
            editable={!disabled}
          />
        </View>
        <View style={styles.pairItem}>
          <FormField
            label="Buy price"
            required
            placeholder="0.00"
            prefix="₱"
            suffix={perUnit}
            value={line.buyPrice}
            onChangeText={(value) => onChange(line.key, 'buyPrice', value)}
            error={errors?.buyPrice}
            keyboardType="decimal-pad"
            inputMode="decimal"
            editable={!disabled}
          />
        </View>
      </View>

      {product ? (
        <PriceComparison priceType="buy" entered={figures.unitBuyPrice} reference={prices.buy} unit={unit} />
      ) : null}

      <View style={[styles.figureBox, { backgroundColor: colors.background }]}>
        <FigureRow label="Purchase total" centavos={figures.purchaseTotal} emphasized />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.subheading, { color: colors.muted }]}>RESALE PLAN</Text>

      <FormField
        label="Supplier price"
        hint={`Planned selling price per ${unit}.`}
        placeholder="0.00"
        prefix="₱"
        suffix={perUnit}
        value={line.supplierPrice}
        onChangeText={(value) => onChange(line.key, 'supplierPrice', value)}
        error={errors?.supplierPrice}
        keyboardType="decimal-pad"
        inputMode="decimal"
        editable={!disabled}
      />
      {product ? (
        <PriceComparison priceType="sell" entered={figures.supplierPrice} reference={prices.sell} unit={unit} />
      ) : null}

      <FormField
        label="Planned buyer"
        placeholder="e.g. ABC Recycling (optional)"
        value={line.plannedBuyer}
        onChangeText={(value) => onChange(line.key, 'plannedBuyer', value)}
        error={errors?.plannedBuyer}
        autoCapitalize="words"
        editable={!disabled}
      />

      <View style={[styles.figureBox, { backgroundColor: colors.background }]}>
        <FigureRow label="Expected selling total" centavos={figures.expectedSellTotal} />
        <FigureRow label="Expected profit" centavos={figures.expectedProfit} tone="profit" emphasized />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_XS,
  },
  removeLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: SPACE_XS + 2,
  },
  fieldLabel: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
  productButton: {
    minHeight: BUTTON_MIN_HEIGHT + 4,
    borderWidth: 1,
    borderRadius: RADIUS_MD,
    paddingHorizontal: SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  productName: {
    flex: 1,
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  productUnit: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
  error: {
    fontSize: FONT_SIZE_CAPTION,
  },
  pair: {
    flexDirection: 'row',
    gap: SPACE_SM + 4,
  },
  pairItem: {
    flex: 1,
  },
  figureBox: {
    borderRadius: RADIUS_MD,
    padding: SPACE_SM + 4,
    gap: SPACE_SM,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  subheading: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: -SPACE_SM,
  },
});
