import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DateStepper } from '@/components/DateStepper';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductPickerModal } from '@/components/ProductPickerModal';
import { SaleLineCard } from '@/components/SaleLineCard';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { SuccessNotice } from '@/components/SuccessNotice';
import { SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
} from '@/constants/payment';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import { NO_PRICES } from '@/domain/materialPrice';
import { formatPeso, formatPesoInput } from '@/domain/money';
import type { Product } from '@/domain/product';
import type { SaleLineField } from '@/domain/sale';
import { useActiveProducts } from '@/products/useActiveProducts';
import { useSaleForm } from '@/sales/useSaleForm';
import { useAppTheme } from '@/theme/useAppTheme';

export default function SellScrapScreen() {
  const { colors, colorScheme } = useAppTheme();
  const { products, pricesByMaterial, error: productsError } = useActiveProducts();
  const { state, dispatch, lineFigures, summary, save } = useSaleForm(pricesByMaterial);
  const [pickingLineKey, setPickingLineKey] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { draft, errors, isSubmitting } = state;

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const pickingLine = draft.lines.find((line) => line.key === pickingLineKey);

  const changeLine = useCallback(
    (key: string, field: SaleLineField, value: string) => dispatch({ type: 'changeLine', key, field, value }),
    [dispatch]
  );

  const removeLine = useCallback((key: string) => dispatch({ type: 'removeLine', key }), [dispatch]);

  const selectProduct = useCallback(
    (product: Product) => {
      if (pickingLineKey) {
        const sellPrice = pricesByMaterial.get(product.id)?.sell;
        dispatch({
          type: 'selectProduct',
          key: pickingLineKey,
          materialId: product.id,
          sellPrice: sellPrice ? formatPesoInput(sellPrice.price) : '',
        });
      }
      setPickingLineKey(null);
    },
    [dispatch, pickingLineKey, pricesByMaterial]
  );

  const onSavePress = useCallback(async () => {
    const isSaved = await save();
    if (isSaved) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [save]);

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        >
          {state.lastSaved ? (
            <SuccessNotice
              title={`Saved ${state.lastSaved.saleNumber}`}
              body={`${state.lastSaved.buyerName} · ${formatPeso(state.lastSaved.totalAmount)} · profit ${formatPeso(
                state.lastSaved.actualProfit
              )}. Ready for the next sale.`}
              onDismiss={() => dispatch({ type: 'dismissSaved' })}
            />
          ) : null}
          {state.submitError ? <ErrorBanner message={state.submitError} /> : null}
          {productsError ? <ErrorBanner message={productsError} /> : null}

          <SectionCard title="Sale">
            <DateStepper
              label="Sale date"
              value={draft.saleDate}
              onChange={(value) => dispatch({ type: 'changeHeader', field: 'saleDate', value })}
              disabled={isSubmitting}
            />
            <FormField
              label="Buyer name"
              placeholder="e.g. Juan"
              hint={`Leave blank to save as ${UNKNOWN_PERSON_NAME}.`}
              value={draft.buyerName}
              onChangeText={(value) => dispatch({ type: 'changeHeader', field: 'buyerName', value })}
              error={errors.buyerName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </SectionCard>

          {draft.lines.map((line, index) => (
            <SaleLineCard
              key={line.key}
              position={index + 1}
              line={line}
              figures={lineFigures[line.key]}
              errors={errors.lines[line.key]}
              product={line.materialId ? productsById.get(line.materialId) : undefined}
              prices={(line.materialId && pricesByMaterial.get(line.materialId)) || NO_PRICES}
              canRemove={draft.lines.length > 1}
              disabled={isSubmitting}
              onChange={changeLine}
              onRemove={removeLine}
              onPickProduct={setPickingLineKey}
            />
          ))}

          <PrimaryButton
            label="Add another material"
            variant="outline"
            icon={{ ios: 'plus', android: 'add', web: 'add' }}
            onPress={() => dispatch({ type: 'addLine' })}
            disabled={isSubmitting}
          />

          <SectionCard title="Payment">
            <ChoiceChips
              label="Payment status"
              options={PAYMENT_STATUSES}
              getLabel={(status) => PAYMENT_STATUS_LABELS[status]}
              value={draft.paymentStatus}
              onChange={(value) => dispatch({ type: 'changeHeader', field: 'paymentStatus', value })}
              disabled={isSubmitting}
            />
            <ChoiceChips
              label="Payment method"
              options={PAYMENT_METHODS}
              getLabel={(method) => PAYMENT_METHOD_LABELS[method]}
              value={draft.paymentMethod}
              onChange={(value) => dispatch({ type: 'changeHeader', field: 'paymentMethod', value })}
              disabled={isSubmitting}
            />
          </SectionCard>

          <SectionCard title="Other details">
            <FormField
              label="Notes"
              placeholder="Optional"
              value={draft.notes}
              onChangeText={(value) => dispatch({ type: 'changeHeader', field: 'notes', value })}
              error={errors.notes}
              multiline
              textAlignVertical="top"
              style={styles.notesInput}
              editable={!isSubmitting}
            />
          </SectionCard>

          <SectionCard title="Sale summary">
            <FigureRow label="Sale total" centavos={summary.totalAmount} />
            <FigureRow label="Cost at buy price" centavos={summary.allocatedPurchaseCost} />
            <FigureRow label="Actual profit" centavos={summary.actualProfit} tone="profit" />
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <FigureRow label="Total from buyer" centavos={summary.totalAmount} emphasized />
          <PrimaryButton
            label="Save sale"
            icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
            onPress={() => {
              void onSavePress();
            }}
            isLoading={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>

      <ProductPickerModal
        visible={pickingLineKey !== null}
        products={products}
        pricesByMaterial={pricesByMaterial}
        priceType="sell"
        selectedId={pickingLine?.materialId ?? null}
        onSelect={selectProduct}
        onClose={() => setPickingLineKey(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: SPACE_MD,
    gap: SPACE_LG,
    paddingBottom: SPACE_LG,
  },
  notesInput: {
    minHeight: SPACE_LG * 4,
    paddingVertical: SPACE_SM,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    gap: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
