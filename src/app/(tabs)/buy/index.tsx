import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DateStepper } from '@/components/DateStepper';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FigureRow } from '@/components/FigureRow';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PrintStatusNotice } from '@/components/PrintStatusNotice';
import { ProductPickerModal } from '@/components/ProductPickerModal';
import { PurchaseLineCard } from '@/components/PurchaseLineCard';
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
import type { PurchaseLineField } from '@/domain/purchase';
import { useActiveProducts } from '@/products/useActiveProducts';
import { useReceiptPrinter } from '@/printing/useReceiptPrinter';
import { usePurchaseForm } from '@/purchases/usePurchaseForm';
import { useAppTheme } from '@/theme/useAppTheme';

export default function BuyScrapScreen() {
  const { colors, colorScheme } = useAppTheme();
  const { products, pricesByMaterial, error: productsError } = useActiveProducts();
  const { state, dispatch, lineFigures, summary, save } = usePurchaseForm();
  const receiptPrinter = useReceiptPrinter('purchase');
  const [pickingLineKey, setPickingLineKey] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { draft, errors, isSubmitting } = state;

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const pickingLine = draft.lines.find((line) => line.key === pickingLineKey);

  const changeLine = useCallback(
    (key: string, field: PurchaseLineField, value: string) => dispatch({ type: 'changeLine', key, field, value }),
    [dispatch]
  );

  const removeLine = useCallback((key: string) => dispatch({ type: 'removeLine', key }), [dispatch]);

  const selectProduct = useCallback(
    (product: Product) => {
      if (pickingLineKey) {
        const prices = pricesByMaterial.get(product.id) ?? NO_PRICES;
        dispatch({
          type: 'selectProduct',
          key: pickingLineKey,
          materialId: product.id,
          buyPrice: prices.buy ? formatPesoInput(prices.buy.price) : '',
          supplierPrice: prices.supplier ? formatPesoInput(prices.supplier.price) : '',
        });
      }
      setPickingLineKey(null);
    },
    [dispatch, pickingLineKey, pricesByMaterial]
  );

  const onSavePress = useCallback(async () => {
    const saved = await save();
    if (saved) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      await receiptPrinter.printAfterSave(saved.id);
    }
  }, [receiptPrinter, save]);

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
              title={`Saved ${state.lastSaved.purchaseNumber}`}
              body={`${state.lastSaved.sellerName} · ${state.lastSaved.lineCount} material${
                state.lastSaved.lineCount === 1 ? '' : 's'
              } · ${formatPeso(state.lastSaved.totalAmount)}. Ready for the next ticket.`}
              onDismiss={() => dispatch({ type: 'dismissSaved' })}
              action={{
                label: 'View ticket',
                onPress: () => {
                  const purchaseId = state.lastSaved?.id;
                  if (purchaseId) {
                    router.navigate({ pathname: '/history/[id]', params: { id: purchaseId } });
                  }
                },
              }}
            />
          ) : null}
          {state.lastSaved && receiptPrinter.isSupported ? (
            <PrintStatusNotice status={receiptPrinter.status} onPrint={() => void receiptPrinter.printLast()} />
          ) : null}
          {state.submitError ? <ErrorBanner message={state.submitError} /> : null}
          {productsError ? <ErrorBanner message={productsError} /> : null}

          <SectionCard title="Ticket">
            <DateStepper
              label="Purchase date"
              value={draft.purchaseDate}
              onChange={(value) => dispatch({ type: 'changeHeader', field: 'purchaseDate', value })}
              disabled={isSubmitting}
            />
            <FormField
              label="Seller name"
              placeholder="e.g. Pedro"
              hint={`Leave blank to save as ${UNKNOWN_PERSON_NAME}.`}
              value={draft.sellerName}
              onChangeText={(value) => dispatch({ type: 'changeHeader', field: 'sellerName', value })}
              error={errors.sellerName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </SectionCard>

          {draft.lines.map((line, index) => (
            <PurchaseLineCard
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

          <SectionCard title="Ticket summary">
            <FigureRow label="Purchase total" centavos={summary.totalAmount} />
            <FigureRow label="Expected from supplier" centavos={summary.expectedSellTotal} />
            <FigureRow label="Expected profit" centavos={summary.expectedProfit} tone="profit" />
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <FigureRow label="Total to pay seller" centavos={summary.totalAmount} emphasized />
          <PrimaryButton
            label="Save purchase"
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
