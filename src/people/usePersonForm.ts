import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import {
  createEmptyPersonDraft,
  draftFromPerson,
  hasPersonErrors,
  personValuesFromDraft,
  validatePersonDraft,
  type PersonDraft,
  type PersonErrors,
  type PersonField,
} from '@/domain/person';
import { nowIso } from '@/domain/timestamps';
import { getPerson, getPersonActivity, insertPerson, updatePerson, type PersonActivity } from '@/people/personRepository';

/** Add a new person, or edit one when `personId` is given. */
export function usePersonForm(personId?: string) {
  const database = useSQLiteContext();
  const [draft, setDraft] = useState<PersonDraft>(() => createEmptyPersonDraft());
  const [activity, setActivity] = useState<PersonActivity | null>(null);
  const [errors, setErrors] = useState<PersonErrors>({});
  const [isLoading, setIsLoading] = useState(Boolean(personId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      return;
    }

    let isCancelled = false;

    Promise.all([getPerson(database, personId), getPersonActivity(database, personId)])
      .then(([person, personActivity]) => {
        if (isCancelled) {
          return;
        }
        if (person) {
          setDraft(draftFromPerson(person));
          setActivity(personActivity);
        } else {
          setLoadError('This person could not be found.');
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Could not load this person.');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [database, personId]);

  const change = useCallback((field: PersonField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError(null);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    const nextErrors = validatePersonDraft(draft);
    if (hasPersonErrors(nextErrors)) {
      setErrors(nextErrors);
      return false;
    }

    setIsSaving(true);
    try {
      const values = personValuesFromDraft(draft);
      if (personId) {
        await updatePerson(database, personId, values, nowIso());
      } else {
        await insertPerson(database, values, nowIso());
      }
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this person.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [database, draft, personId]);

  return { draft, activity, errors, isLoading, loadError, isSaving, saveError, change, save };
}
