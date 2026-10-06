import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PriceRow } from '@/components/PriceRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SuccessNotice } from '@/components/SuccessNotice';
import { FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD } from '@/constants/layout';
import { todayLocalDateKey } from '@/domain/localDate';
import { NO_PRICES } from '@/domain/materialPrice';
import { useCurrentPrices } from '@/products/useCurrentPrices';
import { useAppTheme } from '@/theme/useAppTheme';

const EMPTY_INPUTS = { buy: '', sell: '', supplier: '' };

export default function CurrentPricesScreen() {
  const { colors, colorScheme } = useAppTheme();
  const today = todayLocalDateKey();
  const {
    products,
    currentPrices,
    inputs,
    errors,
    isLoading,
    isSaving,
    loadError,
    saveError,
    savedCount,
    changeInput,
    dismissSaved,
    save,
  } = useCurrentPrices();

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              {savedCount !== null ? (
                <SuccessNotice
                  title={savedCount === 0 ? 'No changes' : 'Prices updated'}
                  body={
                    savedCount === 0
                      ? 'None of the prices were changed.'
                      : `${savedCount} price${savedCount === 1 ? '' : 's'} changed. New tickets use them now.`
                  }
                  onDismiss={dismissSaved}
                />
              ) : null}
              {loadError ? <ErrorBanner message={loadError} /> : null}
              {saveError ? <ErrorBanner message={saveError} /> : null}
              <Text style={[styles.helper, { color: colors.muted }]}>
                Prices stay the same until you change them. Buy fills in on the Buy screen and Sell on the Sell screen.
                Supplier price is kept for price history. Only the prices you change are saved.
              </Text>
              {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
            </View>
          }
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                icon={{ ios: 'shippingbox.fill', android: 'inventory_2', web: 'inventory_2' }}
                title="No active products"
                body="Add a product first, then set its price here."
              />
            )
          }
          renderItem={({ item }) => (
            <PriceRow
              product={item}
              prices={currentPrices.get(item.id) ?? NO_PRICES}
              inputs={inputs[item.id] ?? EMPTY_INPUTS}
              errors={errors[item.id]}
              today={today}
              disabled={isSaving}
              onChange={changeInput}
            />
          )}
        />

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <PrimaryButton
            label="Save price changes"
            icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
            onPress={() => {
              void save();
            }}
            disabled={products.length === 0}
            isLoading={isSaving}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    padding: SPACE_MD,
    gap: SPACE_SM + 4,
    flexGrow: 1,
  },
  header: {
    gap: SPACE_SM + 4,
  },
  helper: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
    paddingHorizontal: SPACE_XS,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
