import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, SPACE_XS, SPACE_SM, SPACE_MD, SPACE_LG } from '@/constants/layout';
import {
  PERSON_ADDRESS_MAX_LENGTH,
  PERSON_PHONE_MAX_LENGTH,
  PERSON_TYPE_HINTS,
  PERSON_TYPE_LABELS,
  PERSON_TYPES,
} from '@/constants/person';
import { PERSON_NAME_MAX_LENGTH } from '@/constants/purchase';
import { formatPeso } from '@/domain/money';
import { usePersonForm } from '@/people/usePersonForm';
import { useAppTheme } from '@/theme/useAppTheme';

type PersonFormProps = {
  personId?: string;
};

function ticketCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function PersonForm({ personId }: PersonFormProps) {
  const { colors, colorScheme } = useAppTheme();
  const { draft, activity, errors, isLoading, loadError, isSaving, saveError, change, save } =
    usePersonForm(personId);
  const isEditing = Boolean(personId);

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
        router.replace('/home/people');
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

          <SectionCard title="Person">
            <FormField
              label="Name"
              required
              placeholder="e.g. Juan Dela Cruz"
              value={draft.name}
              onChangeText={(value) => change('name', value)}
              error={errors.name}
              maxLength={PERSON_NAME_MAX_LENGTH}
              autoCapitalize="words"
              editable={!isSaving}
            />
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Type<Text style={{ color: colors.danger }}> *</Text>
              </Text>
              <ChoiceChips
                label="Type"
                options={PERSON_TYPES}
                getLabel={(type) => PERSON_TYPE_LABELS[type]}
                value={draft.personType}
                onChange={(value) => change('personType', value)}
                disabled={isSaving}
              />
              {errors.personType ? (
                <Text style={[styles.error, { color: colors.danger }]}>{errors.personType}</Text>
              ) : draft.personType ? (
                <Text style={[styles.hint, { color: colors.muted }]}>{PERSON_TYPE_HINTS[draft.personType]}</Text>
              ) : null}
            </View>
          </SectionCard>

          <SectionCard title="Contact">
            <FormField
              label="Phone"
              placeholder="Optional"
              value={draft.phone}
              onChangeText={(value) => change('phone', value)}
              error={errors.phone}
              maxLength={PERSON_PHONE_MAX_LENGTH}
              keyboardType="phone-pad"
              inputMode="tel"
              editable={!isSaving}
            />
            <FormField
              label="Address"
              placeholder="Optional"
              value={draft.address}
              onChangeText={(value) => change('address', value)}
              error={errors.address}
              maxLength={PERSON_ADDRESS_MAX_LENGTH}
              editable={!isSaving}
            />
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

          {activity ? (
            <SectionCard
              title="Tickets"
              description="Totals for tickets where this person was picked. Renaming does not change old tickets."
            >
              <DetailRow
                label={`Bought from (${ticketCount(activity.purchaseCount, 'ticket')})`}
                value={formatPeso(activity.purchaseTotal)}
              />
              <DetailRow
                label={`Sold to (${ticketCount(activity.saleCount, 'ticket')})`}
                value={formatPeso(activity.saleTotal)}
              />
            </SectionCard>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <PrimaryButton
            label={isEditing ? 'Save changes' : 'Save person'}
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
  hint: {
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
