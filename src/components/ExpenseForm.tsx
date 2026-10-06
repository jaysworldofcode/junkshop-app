import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DateStepper } from '@/components/DateStepper';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, EXPENSE_TITLE_MAX_LENGTH } from '@/constants/expense';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '@/constants/payment';
import { useExpenseForm } from '@/expenses/useExpenseForm';
import { useAppTheme } from '@/theme/useAppTheme';

type ExpenseFormProps = {
  expenseId?: string;
};

export function ExpenseForm({ expenseId }: ExpenseFormProps) {
  const { colors, colorScheme } = useAppTheme();
  const { draft, errors, isLoading, loadError, isSaving, saveError, change, save } = useExpenseForm(expenseId);
  const isEditing = Boolean(expenseId);

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

  const submit = async () => {
    if (await save()) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/expenses');
      }
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        >
          {saveError ? <ErrorBanner message={saveError} /> : null}

          <SectionCard title="Expense">
            <DateStepper
              label="Date"
              value={draft.expenseDate}
              onChange={(value) => change('expenseDate', value)}
              disabled={isSaving}
            />
            <FormField
              label="Title"
              required
              placeholder="e.g. Diesel for the truck"
              value={draft.title}
              onChangeText={(value) => change('title', value)}
              error={errors.title}
              maxLength={EXPENSE_TITLE_MAX_LENGTH}
              editable={!isSaving}
            />
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Category<Text style={{ color: colors.danger }}> *</Text>
              </Text>
              <ChoiceChips
                label="Category"
                options={EXPENSE_CATEGORIES}
                getLabel={(category) => EXPENSE_CATEGORY_LABELS[category]}
                value={draft.category}
                onChange={(value) => change('category', value)}
                disabled={isSaving}
              />
              {errors.category ? (
                <Text style={[styles.error, { color: colors.danger }]}>{errors.category}</Text>
              ) : null}
            </View>
            <FormField
              label="Amount"
              required
              placeholder="0.00"
              prefix="₱"
              value={draft.amount}
              onChangeText={(value) => change('amount', value)}
              error={errors.amount}
              keyboardType="decimal-pad"
              inputMode="decimal"
              editable={!isSaving}
            />
          </SectionCard>

          <SectionCard title="Payment">
            <ChoiceChips
              label="Payment method"
              options={PAYMENT_METHODS}
              getLabel={(method) => PAYMENT_METHOD_LABELS[method]}
              value={draft.paymentMethod}
              onChange={(value) => change('paymentMethod', value)}
              disabled={isSaving}
            />
          </SectionCard>

          <SectionCard title="Other details">
            <FormField
              label="Notes"
              placeholder="Optional"
              value={draft.notes}
              onChangeText={(value) => change('notes', value)}
              error={errors.notes}
              multiline
              textAlignVertical="top"
              style={styles.notesInput}
              editable={!isSaving}
            />
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <PrimaryButton
            label={isEditing ? 'Save changes' : 'Save expense'}
            icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
            onPress={() => {
              void submit();
            }}
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
  fieldGroup: {
    gap: SPACE_XS + 2,
  },
  label: {
    fontSize: FONT_SIZE_BODY - 1,
    fontWeight: '700',
  },
  error: {
    fontSize: FONT_SIZE_CAPTION,
  },
  notesInput: {
    minHeight: SPACE_LG * 4,
    paddingVertical: SPACE_SM,
  },
  footer: {
    paddingHorizontal: SPACE_MD,
    paddingVertical: SPACE_SM + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
