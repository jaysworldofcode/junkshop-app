import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ChoiceChips } from '@/components/ChoiceChips';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { WarningNotice } from '@/components/WarningNotice';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { PRODUCT_UNIT_OPTIONS } from '@/constants/product';
import { todayLocalDateKey } from '@/domain/localDate';
import { priceSinceLabel } from '@/domain/materialPrice';
import type { Product, ProductDraft } from '@/domain/product';
import { useProductForm } from '@/products/useProductForm';
import { useAppTheme } from '@/theme/useAppTheme';

type ProductFormProps = {
  productId?: string;
};

export function ProductForm({ productId }: ProductFormProps) {
  const { colors, colorScheme } = useAppTheme();
  const { state, currentPrices, isLoading, loadError, change, save } = useProductForm({ productId });
  const today = todayLocalDateKey();
  const perUnit = `/${state.draft.unit.trim() || 'unit'}`;
  const [duplicate, setDuplicate] = useState<Product | null>(null);
  const isEditing = Boolean(productId);
  const isLocked = isLoading || state.isSubmitting;

  const changeField = useCallback(
    (field: keyof ProductDraft, value: string | boolean) => {
      setDuplicate(null);
      change(field, value);
    },
    [change]
  );

  const submit = useCallback(
    async (ignoreDuplicateWarning: boolean) => {
      const result = await save({ ignoreDuplicateWarning });

      if (result.status === 'saved') {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products');
        }
      } else if (result.status === 'duplicate') {
        setDuplicate(result.product);
      }
    },
    [save]
  );

  if (loadError) {
    return (
      <Screen>
        <ErrorBanner message={loadError} />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        >
          {state.submitError ? <ErrorBanner message={state.submitError} /> : null}

          <SectionCard title="Product" description="The scrap material, such as Copper or Aluminum.">
            <FormField
              label="Name"
              required
              placeholder="e.g. Copper"
              value={state.draft.name}
              onChangeText={(value) => changeField('name', value)}
              error={state.fieldErrors.name}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={!isEditing}
              returnKeyType="next"
              editable={!isLocked}
            />

            <View style={styles.unitGroup}>
              <FormField
                label="Unit"
                required
                hint="How this material is weighed or counted. Pick one or type your own."
                value={state.draft.unit}
                onChangeText={(value) => changeField('unit', value)}
                error={state.fieldErrors.unit}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLocked}
              />
              <ChoiceChips
                label="Common units"
                options={PRODUCT_UNIT_OPTIONS}
                value={state.draft.unit}
                onChange={(value) => changeField('unit', value)}
                disabled={isLocked}
              />
            </View>
          </SectionCard>

          <SectionCard
            title="Current prices"
            description="Fills in automatically on the Buy screen. Prices stay until you change them."
          >
            <View style={styles.pair}>
              <View style={styles.pairItem}>
                <FormField
                  label="Buy price"
                  placeholder="0.00"
                  prefix="₱"
                  suffix={perUnit}
                  hint={priceSinceLabel(currentPrices.buy, today)}
                  value={state.draft.buyPrice}
                  onChangeText={(value) => changeField('buyPrice', value)}
                  error={state.fieldErrors.buyPrice}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  editable={!isLocked}
                />
              </View>
              <View style={styles.pairItem}>
                <FormField
                  label="Sell price"
                  placeholder="0.00"
                  prefix="₱"
                  suffix={perUnit}
                  hint={priceSinceLabel(currentPrices.sell, today)}
                  value={state.draft.sellPrice}
                  onChangeText={(value) => changeField('sellPrice', value)}
                  error={state.fieldErrors.sellPrice}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  editable={!isLocked}
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Optional details" description="Helps you find the product faster.">
            <FormField
              label="Code"
              placeholder="e.g. CU-1"
              value={state.draft.code}
              onChangeText={(value) => changeField('code', value)}
              error={state.fieldErrors.code}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLocked}
            />
            <FormField
              label="Category"
              placeholder="e.g. Metals"
              value={state.draft.category}
              onChangeText={(value) => changeField('category', value)}
              error={state.fieldErrors.category}
              autoCapitalize="words"
              editable={!isLocked}
            />
          </SectionCard>

          <SectionCard title="Status">
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {state.draft.isActive ? 'Active' : 'Turned off'}
                </Text>
                <Text style={[styles.switchHelp, { color: colors.muted }]}>
                  {state.draft.isActive
                    ? 'Shows on the Buy screen.'
                    : 'Hidden from new purchases. It is not deleted, and old purchases still keep it.'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Active product"
                value={state.draft.isActive}
                onValueChange={(value) => changeField('isActive', value)}
                disabled={isLocked}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </SectionCard>

          {duplicate ? (
            <WarningNotice
              title="This product already exists"
              body={`An active product named ${duplicate.name} in ${duplicate.unit} is already saved. Change the name or unit, or save it anyway.`}
            >
              <PrimaryButton
                label="Save anyway"
                variant="outline"
                onPress={() => {
                  void submit(true);
                }}
                isLoading={state.isSubmitting}
              />
            </WarningNotice>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <PrimaryButton
            label={isEditing ? 'Save changes' : 'Add product'}
            icon={
              isEditing
                ? { ios: 'checkmark', android: 'check', web: 'check' }
                : { ios: 'plus', android: 'add', web: 'add' }
            }
            onPress={() => {
              void submit(false);
            }}
            disabled={duplicate !== null}
            isLoading={state.isSubmitting && duplicate === null}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG,
  },
  pair: {
    flexDirection: 'row',
    gap: SPACE_SM + 4,
  },
  pairItem: {
    flex: 1,
  },
  unitGroup: {
    gap: SPACE_SM + 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE_MD,
  },
  switchCopy: {
    flex: 1,
    gap: SPACE_XS,
  },
  switchLabel: {
    fontSize: FONT_SIZE_BODY + 1,
    fontWeight: '700',
  },
  switchHelp: {
    fontSize: FONT_SIZE_CAPTION,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
