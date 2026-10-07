import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorBanner } from '@/components/ErrorBanner';
import { FormField } from '@/components/FormField';
import { PersonPickerModal } from '@/components/PersonPickerModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SPACE_SM } from '@/constants/layout';
import type { TicketRole } from '@/constants/person';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import { canSaveAsContact, type Person } from '@/domain/person';
import { usePeople } from '@/people/usePeople';

type PersonNameFieldProps = {
  role: TicketRole;
  label: string;
  placeholder: string;
  name: string;
  personId: string | null;
  error?: string;
  disabled?: boolean;
  onChangeName: (name: string) => void;
  onPick: (person: Person) => void;
};

/** A ticket's seller or buyer: type any name, pick a saved person, or save the typed name as a contact. */
export function PersonNameField({
  role,
  label,
  placeholder,
  name,
  personId,
  error,
  disabled = false,
  onChangeName,
  onPick,
}: PersonNameFieldProps) {
  const { people, saveContact } = usePeople();
  const [isPicking, setIsPicking] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const showSaveContact = !personId && canSaveAsContact(name);

  const onSaveContact = async () => {
    setIsSavingContact(true);
    setContactError(null);
    try {
      onPick(await saveContact(name, role));
    } catch (saveError) {
      setContactError(saveError instanceof Error ? saveError.message : 'Could not save this contact.');
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <>
      <FormField
        label={label}
        placeholder={placeholder}
        hint={
          personId
            ? 'Saved contact. Typing a different name unlinks it.'
            : `Leave blank to save as ${UNKNOWN_PERSON_NAME}.`
        }
        value={name}
        onChangeText={(value) => {
          setContactError(null);
          onChangeName(value);
        }}
        error={error}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!disabled}
      />
      {contactError ? <ErrorBanner message={contactError} /> : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          <PrimaryButton
            label="Pick saved"
            variant="outline"
            icon={{ ios: 'person.crop.circle', android: 'contacts', web: 'contacts' }}
            onPress={() => setIsPicking(true)}
            disabled={disabled}
          />
        </View>
        {showSaveContact ? (
          <View style={styles.action}>
            <PrimaryButton
              label="Save as contact"
              variant="outline"
              icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
              onPress={() => {
                void onSaveContact();
              }}
              disabled={disabled}
              isLoading={isSavingContact}
            />
          </View>
        ) : null}
      </View>

      <PersonPickerModal
        visible={isPicking}
        role={role}
        people={people}
        selectedId={personId}
        onSelect={(person) => {
          setIsPicking(false);
          setContactError(null);
          onPick(person);
        }}
        onClose={() => setIsPicking(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE_SM,
  },
  action: {
    flexGrow: 1,
    flexBasis: 140,
  },
});
