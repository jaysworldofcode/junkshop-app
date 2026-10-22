import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { DetailRow } from '@/components/DetailRow';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PersonNameField } from '@/components/PersonNameField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionCard } from '@/components/SectionCard';
import { SuccessNotice } from '@/components/SuccessNotice';
import { WarningNotice } from '@/components/WarningNotice';
import {
  FONT_SIZE_BODY,
  FONT_SIZE_TITLE,
  MAX_CONTENT_WIDTH,
  RADIUS_LG,
  SPACE_SM,
  SPACE_MD,
} from '@/constants/layout';
import type { TicketRole } from '@/constants/person';
import type { TicketStatus, TransactionKind } from '@/constants/transaction';
import { formatDateLabel, type LocalDateKey } from '@/domain/localDate';
import { ticketPersonError, toTicketPerson, type Person, type TicketPerson } from '@/domain/person';
import { useAppTheme } from '@/theme/useAppTheme';

const ROLE_COPY: Record<
  TicketRole,
  {
    title: string;
    label: string;
    placeholder: string;
    change: string;
    save: string;
    savedTitle: string;
    savedBody: string;
  }
> = {
  seller: {
    title: 'Seller',
    label: 'Seller name',
    placeholder: 'e.g. Pedro',
    change: 'Change seller',
    save: 'Save seller',
    savedTitle: 'Seller updated',
    savedBody: 'Home, Reports, and People will use this name.',
  },
  buyer: {
    title: 'Buyer',
    label: 'Buyer name',
    placeholder: 'e.g. Maria',
    change: 'Change buyer',
    save: 'Save buyer',
    savedTitle: 'Buyer updated',
    savedBody: 'Home, Reports, and People will use this name.',
  },
};

const KIND_COPY: Record<
  TransactionKind,
  {
    cancelledBody: string;
    cancel: string;
    restore: string;
    confirmTitle: string;
    cancelledTitle: string;
    cancelledNotice: string;
    restoredTitle: string;
    restoredNotice: string;
  }
> = {
  purchase: {
    cancelledBody: 'This purchase is cancelled. Home and Reports do not count it.',
    cancel: 'Cancel this purchase',
    restore: 'Restore this purchase',
    confirmTitle: 'Cancel this purchase?',
    cancelledTitle: 'Purchase cancelled',
    cancelledNotice: 'It no longer counts on Home or Reports. You can restore it later.',
    restoredTitle: 'Purchase restored',
    restoredNotice: 'It counts on Home and Reports again.',
  },
  sale: {
    cancelledBody: 'This sale is cancelled. Home and Reports do not count it.',
    cancel: 'Cancel this sale',
    restore: 'Restore this sale',
    confirmTitle: 'Cancel this sale?',
    cancelledTitle: 'Sale cancelled',
    cancelledNotice: 'It no longer counts on Home or Reports. You can restore it later.',
    restoredTitle: 'Sale restored',
    restoredNotice: 'It counts on Home and Reports again.',
  },
};

type TicketManageSectionProps = {
  role: TicketRole;
  ticketKind: TransactionKind;
  personId: string | null;
  personName: string;
  ticketDate: LocalDateKey;
  status: TicketStatus;
  onSavePerson: (person: TicketPerson) => Promise<void>;
  onSaveDate: (date: LocalDateKey) => Promise<void>;
  onSetStatus: (status: TicketStatus) => Promise<void>;
};

export function TicketManageSection({
  role,
  ticketKind,
  personId,
  personName,
  ticketDate,
  status,
  onSavePerson,
  onSaveDate,
  onSetStatus,
}: TicketManageSectionProps) {
  const { colors } = useAppTheme();
  const roleCopy = ROLE_COPY[role];
  const kindCopy = KIND_COPY[ticketKind];
  const isCancelled = status === 'cancelled';

  const [draft, setDraft] = useState<{ name: string; personId: string | null } | null>(null);
  const [draftDate, setDraftDate] = useState<LocalDateKey | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  const isEditing = draft !== null;
  const name = draft?.name ?? personName;
  const linkedId = draft?.personId ?? personId;

  const persistPerson = async (person: TicketPerson) => {
    setIsBusy(true);
    setError(null);
    setNameError(undefined);
    try {
      await onSavePerson(person);
      setDraft(null);
      setNotice({ title: roleCopy.savedTitle, body: roleCopy.savedBody });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the person on this ticket.');
    } finally {
      setIsBusy(false);
    }
  };

  const onSaveTypedPerson = () => {
    const invalid = ticketPersonError(name);
    if (invalid) {
      setNameError(invalid);
      return;
    }
    void persistPerson(toTicketPerson(name, linkedId));
  };

  const onPickPerson = (person: Person) => {
    setDraft({ name: person.name, personId: person.id });
    void persistPerson({ personId: person.id, name: person.name });
  };

  const persistDate = async (date: LocalDateKey) => {
    setIsBusy(true);
    setError(null);
    try {
      await onSaveDate(date);
      setDraftDate(null);
      setNotice({ title: 'Date updated', body: `Home and Reports now count this ticket on ${formatDateLabel(date)}.` });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not change the date on this ticket.');
    } finally {
      setIsBusy(false);
    }
  };

  const persistStatus = async (nextStatus: TicketStatus, title: string, body: string) => {
    setIsBusy(true);
    setError(null);
    setIsConfirming(false);
    try {
      await onSetStatus(nextStatus);
      setNotice({ title, body });
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not update this ticket.');
    } finally {
      setIsBusy(false);
    }
  };

  const nextPerson = toTicketPerson(name, linkedId);
  const personChanged = nextPerson.personId !== personId || nextPerson.name !== personName;

  return (
    <>
      {isCancelled ? <WarningNotice title="Cancelled" body={kindCopy.cancelledBody} /> : null}
      {notice ? (
        <SuccessNotice title={notice.title} body={notice.body} onDismiss={() => setNotice(null)} />
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}

      <SectionCard title={roleCopy.title}>
        {isEditing ? (
          <>
            <PersonNameField
              role={role}
              label={roleCopy.label}
              placeholder={roleCopy.placeholder}
              name={name}
              personId={linkedId}
              error={nameError}
              disabled={isBusy}
              onChangeName={(value) => {
                setNameError(undefined);
                setDraft({ name: value, personId: null });
              }}
              onPick={onPickPerson}
            />
            <View style={styles.actions}>
              <View style={styles.action}>
                <PrimaryButton
                  label="Back"
                  variant="outline"
                  onPress={() => {
                    setDraft(null);
                    setNameError(undefined);
                    setError(null);
                  }}
                  disabled={isBusy}
                />
              </View>
              <View style={styles.action}>
                <PrimaryButton
                  label={roleCopy.save}
                  icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  onPress={onSaveTypedPerson}
                  disabled={!personChanged}
                  isLoading={isBusy}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <DetailRow label={roleCopy.title} value={personName} />
            <PrimaryButton
              label={roleCopy.change}
              variant="outline"
              icon={{ ios: 'person.crop.circle', android: 'contacts', web: 'contacts' }}
              onPress={() => {
                setNotice(null);
                setError(null);
                setDraft({ name: personName, personId });
              }}
              disabled={isBusy}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Date"
        description={draftDate !== null ? 'The ticket number stays the same, so it still matches the printed receipt.' : undefined}
      >
        {draftDate !== null ? (
          <>
            <DateField label="Ticket date" value={draftDate} onChange={setDraftDate} disabled={isBusy} />
            <View style={styles.actions}>
              <View style={styles.action}>
                <PrimaryButton
                  label="Back"
                  variant="outline"
                  onPress={() => {
                    setDraftDate(null);
                    setError(null);
                  }}
                  disabled={isBusy}
                />
              </View>
              <View style={styles.action}>
                <PrimaryButton
                  label="Save date"
                  icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  onPress={() => {
                    void persistDate(draftDate);
                  }}
                  disabled={draftDate === ticketDate}
                  isLoading={isBusy}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <DetailRow label="Date" value={formatDateLabel(ticketDate)} />
            <PrimaryButton
              label="Change date"
              variant="outline"
              icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              onPress={() => {
                setNotice(null);
                setError(null);
                setDraftDate(ticketDate);
              }}
              disabled={isBusy}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Ticket status"
        description={
          isCancelled
            ? 'Restore it if this ticket should count again on Home and Reports.'
            : 'Cancel it if this ticket was a mistake. You can restore it later.'
        }
      >
        {isCancelled ? (
          <PrimaryButton
            label={kindCopy.restore}
            icon={{ ios: 'arrow.uturn.backward', android: 'history', web: 'history' }}
            onPress={() => {
              void persistStatus('active', kindCopy.restoredTitle, kindCopy.restoredNotice);
            }}
            isLoading={isBusy}
          />
        ) : (
          <PrimaryButton
            label={kindCopy.cancel}
            variant="outline"
            icon={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }}
            onPress={() => {
              setNotice(null);
              setIsConfirming(true);
            }}
            disabled={isBusy}
          />
        )}
      </SectionCard>

      <Modal
        visible={isConfirming}
        transparent
        animationType="fade"
        onRequestClose={isBusy ? undefined : () => setIsConfirming(false)}
      >
        <View style={styles.backdrop}>
          <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.confirmTitle, { color: colors.text }]}>
              {kindCopy.confirmTitle}
            </Text>
            <Text style={[styles.confirmBody, { color: colors.muted }]}>
              Home and Reports will ignore it. You can restore it later.
            </Text>
            <View style={styles.actions}>
              <View style={styles.action}>
                <PrimaryButton
                  label="Back"
                  variant="outline"
                  onPress={() => setIsConfirming(false)}
                  disabled={isBusy}
                />
              </View>
              <View style={styles.action}>
                <PrimaryButton
                  label="Cancel ticket"
                  variant="danger"
                  onPress={() => {
                    void persistStatus('cancelled', kindCopy.cancelledTitle, kindCopy.cancelledNotice);
                  }}
                  isLoading={isBusy}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: SPACE_SM,
  },
  action: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE_MD,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    borderWidth: 1,
    borderRadius: RADIUS_LG,
    padding: SPACE_MD,
    gap: SPACE_SM + 4,
  },
  confirmTitle: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: '700',
  },
  confirmBody: {
    fontSize: FONT_SIZE_BODY - 1,
    lineHeight: 22,
  },
});
