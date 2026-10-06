import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SearchField } from '@/components/SearchField';
import {
  BUTTON_MIN_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_CAPTION,
  FONT_SIZE_TITLE,
  HIT_SLOP,
  ICON_SIZE_MD,
  MAX_CONTENT_WIDTH,
  RADIUS_LG,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import type { ProductPrices } from '@/domain/materialPrice';
import { formatPeso } from '@/domain/money';
import { normalizeProductKey, type Product, type ProductWithUsage } from '@/domain/product';
import { useAppTheme } from '@/theme/useAppTheme';

type ProductPickerModalProps = {
  visible: boolean;
  products: ProductWithUsage[];
  pricesByMaterial: Map<string, ProductPrices>;
  selectedId: string | null;
  onSelect: (product: Product) => void;
  onClose: () => void;
};

function usageLabel(product: ProductWithUsage): string | null {
  if (product.purchaseCount === 0) {
    return null;
  }

  return `Bought ${product.purchaseCount} time${product.purchaseCount === 1 ? '' : 's'}`;
}

function matchesSearch(product: Product, search: string): boolean {
  const needle = normalizeProductKey(search);
  return [product.name, product.code, product.category].some(
    (value) => value !== null && normalizeProductKey(value).includes(needle)
  );
}

export function ProductPickerModal({
  visible,
  products,
  pricesByMaterial,
  selectedId,
  onSelect,
  onClose,
}: ProductPickerModalProps) {
  const { colors, colorScheme } = useAppTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => (search.trim().length === 0 ? products : products.filter((product) => matchesSearch(product, search))),
    [products, search]
  );

  const close = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              Pick a product
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={HIT_SLOP} onPress={close}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor={colors.text}
                size={ICON_SIZE_MD}
              />
            </Pressable>
          </View>

          <SearchField value={search} onChangeText={setSearch} placeholder="Search name, code, or category" />
          {products.length > 0 ? (
            <Text style={[styles.helper, { color: colors.muted }]}>Most used products are shown first.</Text>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              products.length === 0 ? (
                <View style={styles.emptyBox}>
                  <EmptyState
                    icon={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                    title="No active products"
                    body="Add Copper, Aluminum, and other materials on the Products tab first."
                  />
                  <PrimaryButton
                    label="Go to Products"
                    variant="outline"
                    onPress={() => {
                      close();
                      router.navigate('/products');
                    }}
                  />
                </View>
              ) : (
                <EmptyState title="No matching products" body="Try a different name, code, or category." />
              )
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              const buyPrice = pricesByMaterial.get(item.id)?.buy;
              const details = [usageLabel(item), item.code, item.category].filter(Boolean).join(' · ');

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, per ${item.unit}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setSearch('');
                    onSelect(item);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
                    {details ? (
                      <Text style={[styles.optionDetails, { color: colors.muted }]}>{details}</Text>
                    ) : null}
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={[styles.priceLabel, { color: buyPrice ? colors.text : colors.inactive }]}>
                      {buyPrice ? formatPeso(buyPrice.price) : 'No price'}
                    </Text>
                    <Text style={[styles.unitLabel, { color: colors.muted }]}>per {item.unit}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    padding: SPACE_MD,
    gap: SPACE_MD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
  },
  list: {
    gap: SPACE_SM,
    paddingBottom: SPACE_MD,
    flexGrow: 1,
  },
  emptyBox: {
    gap: SPACE_MD,
  },
  option: {
    minHeight: BUTTON_MIN_HEIGHT + SPACE_MD,
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_SM,
  },
  optionCopy: {
    flex: 1,
    gap: SPACE_XS / 2,
  },
  optionName: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  optionDetails: {
    fontSize: FONT_SIZE_CAPTION,
  },
  helper: {
    fontSize: FONT_SIZE_CAPTION,
    marginTop: -SPACE_SM,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: FONT_SIZE_BODY,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unitLabel: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '700',
  },
});
