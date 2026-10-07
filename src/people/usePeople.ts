import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import type { TicketRole } from '@/constants/person';
import { createEmptyPersonDraft, findPersonByName, personValuesFromDraft, type Person } from '@/domain/person';
import { nowIso } from '@/domain/timestamps';
import { insertPerson, listPeople } from '@/people/personRepository';

/** All saved people, reloaded whenever the screen comes into view. */
export function usePeople() {
  const database = useSQLiteContext();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setPeople(await listPeople(database));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load people.');
    } finally {
      setIsLoading(false);
    }
  }, [database]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  /** Links to a saved person with the same name instead of adding a second copy. */
  const saveContact = useCallback(
    async (name: string, role: TicketRole): Promise<Person> => {
      const existing = findPersonByName(await listPeople(database), name, role);
      const person =
        existing ??
        (await insertPerson(database, personValuesFromDraft({ ...createEmptyPersonDraft(role), name }), nowIso()));
      await reload();
      return person;
    },
    [database, reload]
  );

  return { people, isLoading, error, reload, saveContact };
}
