import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductListItem } from '@/components/ProductListItem';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import {
  FONT_SIZE_CAPTION,
  SEARCH_DEBOUNCE_MS,
  SPACE_XS,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import { NO_PRICES } from '@/domain/materialPrice';
import type { Product } from '@/domain/product';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProducts } from '@/products/useProducts';
import { useAppTheme } from '@/theme/useAppTheme';

type ProductSection = {
  key: 'active' | 'off';
  title: string;
  data: Product[];
};

export default function ProductListScreen() {
  const { colors, colorScheme } = useAppTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { products, pricesByMaterial, isLoading, error, reload } = useProducts(debouncedSearch);
  const isSearching = search.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const sections = useMemo<ProductSection[]>(() => {
    const active = products.filter((product) => product.isActive);
    const off = products.filter((product) => !product.isActive);

    return [
      { key: 'active' as const, title: `Active · ${active.length}`, data: active },
      { key: 'off' as const, title: `Turned off · ${off.length}`, data: off },
    ].filter((section) => section.data.length > 0);
  }, [products]);

  const openProduct = useCallback((product: Product) => {
    router.push(`/products/${product.id}`);
  }, []);

  return (
    <Screen padded={false}>
      <View style={styles.searchBar}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search name, code, or category" />
        <Text style={[styles.helper, { color: colors.muted }]}>
          Scrap materials you buy and sell. The Buy screen only shows active products.
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          <>
            {error ? <ErrorBanner message={error} /> : null}
            {isLoading && products.length === 0 ? <ActivityIndicator color={colors.primary} /> : null}
          </>
        }
        renderSectionHeader={({ section }) => (
          <Text
            accessibilityRole="header"
            style={[
              styles.sectionTitle,
              { color: section.key === 'active' ? colors.primary : colors.muted },
            ]}
          >
            {section.title.toUpperCase()}
          </Text>
        )}
        ListEmptyComponent={
          isLoading ? null : isSearching ? (
            <EmptyState
              icon={{ ios: 'magnifyingglass', android: 'search_off', web: 'search_off' }}
              title="No matching products"
              body="Try a different name, code, or category."
            />
          ) : (
            <EmptyState
              icon={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
              title="No products yet"
              body="Add your scrap materials, like Copper or Aluminum in kg. The Buy screen picks from this list."
            />
          )
        }
        renderItem={({ item }) => (
          <ProductListItem
            product={item}
            prices={pricesByMaterial.get(item.id) ?? NO_PRICES}
            onPress={openProduct}
          />
        )}
      />

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <PrimaryButton
            label="Prices"
            variant="outline"
            icon={{ ios: 'tag.fill', android: 'sell', web: 'sell' }}
            onPress={() => router.push('/products/prices')}
          />
        </View>
        <View style={styles.footerItem}>
          <PrimaryButton
            label="Add product"
            icon={{ ios: 'plus', android: 'add', web: 'add' }}
            onPress={() => router.push('/products/new')}
          />
        </View>
      </View>
    </Screen>
  );
}

function ItemGap() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  searchBar: {
    paddingHorizontal: SPACE_MD,
    paddingTop: SPACE_MD,
    paddingBottom: SPACE_SM,
    gap: SPACE_SM,
  },
  helper: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
    paddingHorizontal: SPACE_XS,
  },
  list: {
    paddingHorizontal: SPACE_MD,
    paddingBottom: SPACE_MD,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZE_CAPTION,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: SPACE_XS,
    paddingTop: SPACE_MD,
    paddingBottom: SPACE_SM,
  },
  itemGap: {
    height: SPACE_SM,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: SPACE_SM,
  },
  footerItem: {
    flex: 1,
  },
});
