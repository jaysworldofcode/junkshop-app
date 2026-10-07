import {
  PERSON_ADDRESS_MAX_LENGTH,
  PERSON_PHONE_MAX_LENGTH,
  PERSON_TYPES,
  PERSON_TYPES_FOR_ROLE,
  type PersonType,
  type TicketRole,
} from '@/constants/person';
import { NOTES_MAX_LENGTH, PERSON_NAME_MAX_LENGTH, UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import { optionalText } from '@/domain/text';

export type Person = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  personType: PersonType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonDraft = {
  name: string;
  phone: string;
  address: string;
  personType: PersonType | '';
  notes: string;
};

export type PersonField = keyof PersonDraft;
export type PersonErrors = Partial<Record<PersonField, string>>;

/** The fields a save writes. id and created_at are set by the repository on insert. */
export type PersonValues = Pick<Person, 'name' | 'phone' | 'address' | 'personType' | 'notes'>;

export function normalizePersonKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function createEmptyPersonDraft(personType: PersonType | '' = ''): PersonDraft {
  return { name: '', phone: '', address: '', personType, notes: '' };
}

export function draftFromPerson(person: Person): PersonDraft {
  return {
    name: person.name,
    phone: person.phone ?? '',
    address: person.address ?? '',
    personType: person.personType,
    notes: person.notes ?? '',
  };
}

function isPersonType(value: string): value is PersonType {
  return (PERSON_TYPES as readonly string[]).includes(value);
}

export function validatePersonDraft(draft: PersonDraft): PersonErrors {
  const errors: PersonErrors = {};
  const name = draft.name.trim();

  if (name.length === 0) {
    errors.name = 'Enter a name.';
  } else if (name.length > PERSON_NAME_MAX_LENGTH) {
    errors.name = `Name must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`;
  } else if (normalizePersonKey(name) === normalizePersonKey(UNKNOWN_PERSON_NAME)) {
    errors.name = `${UNKNOWN_PERSON_NAME} is used for blank names on tickets. Enter the person's real name.`;
  }

  if (!isPersonType(draft.personType)) {
    errors.personType = 'Pick a type.';
  }

  if (draft.phone.trim().length > PERSON_PHONE_MAX_LENGTH) {
    errors.phone = `Phone must be ${PERSON_PHONE_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.address.trim().length > PERSON_ADDRESS_MAX_LENGTH) {
    errors.address = `Address must be ${PERSON_ADDRESS_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function hasPersonErrors(errors: PersonErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Expects a draft that already passed validatePersonDraft. */
export function personValuesFromDraft(draft: PersonDraft): PersonValues {
  if (!isPersonType(draft.personType)) {
    throw new Error('Person is incomplete.');
  }

  return {
    name: draft.name.trim().replace(/\s+/g, ' '),
    phone: optionalText(draft.phone),
    address: optionalText(draft.address),
    personType: draft.personType,
    notes: optionalText(draft.notes),
  };
}

export function personFitsRole(person: Person, role: TicketRole): boolean {
  return PERSON_TYPES_FOR_ROLE[role].includes(person.personType);
}

export function matchesPersonSearch(person: Person, search: string): boolean {
  const needle = normalizePersonKey(search);
  if (needle.length === 0) {
    return true;
  }
  return [person.name, person.phone, person.address].some(
    (value) => value !== null && normalizePersonKey(value).includes(needle)
  );
}

/** A saved person whose name is the same as a typed name, preferring one that fits the ticket. */
export function findPersonByName(people: Person[], name: string, role: TicketRole): Person | null {
  const key = normalizePersonKey(name);
  if (key.length === 0) {
    return null;
  }
  const sameName = people.filter((person) => normalizePersonKey(person.name) === key);
  return sameName.find((person) => personFitsRole(person, role)) ?? sameName[0] ?? null;
}

/** A typed name on a ticket can become a contact unless it is blank or the Unknown placeholder. */
export function canSaveAsContact(name: string): boolean {
  const key = normalizePersonKey(name);
  return key.length > 0 && key !== normalizePersonKey(UNKNOWN_PERSON_NAME) && name.trim().length <= PERSON_NAME_MAX_LENGTH;
}

export type SellerPurchase = {
  sellerId: string | null;
  /** Current name of the linked person, so a rename shows on the dashboard. */
  personName: string | null;
  /** Name stored on the ticket when it was saved. */
  sellerName: string | null;
  totalAmount: number;
};

export type TopSeller = {
  key: string;
  personId: string | null;
  name: string;
  purchaseCount: number;
  purchaseTotal: number;
};

/**
 * Groups Buy tickets by saved person, or by typed name when the seller was not saved.
 * Blank and Unknown sellers are left out because they are not one person.
 */
export function rankTopSellers(purchases: SellerPurchase[], limit: number): TopSeller[] {
  const sellers = new Map<string, TopSeller>();
  const unknownKey = normalizePersonKey(UNKNOWN_PERSON_NAME);

  for (const purchase of purchases) {
    const typedKey = normalizePersonKey(purchase.sellerName ?? '');
    if (!purchase.sellerId && (typedKey.length === 0 || typedKey === unknownKey)) {
      continue;
    }

    const key = purchase.sellerId ? `person:${purchase.sellerId}` : `name:${typedKey}`;
    const name = purchase.personName ?? purchase.sellerName?.trim() ?? UNKNOWN_PERSON_NAME;
    const current = sellers.get(key) ?? { key, personId: purchase.sellerId, name, purchaseCount: 0, purchaseTotal: 0 };

    sellers.set(key, {
      ...current,
      purchaseCount: current.purchaseCount + 1,
      purchaseTotal: current.purchaseTotal + purchase.totalAmount,
    });
  }

  return [...sellers.values()]
    .sort((a, b) => b.purchaseTotal - a.purchaseTotal || a.name.localeCompare(b.name))
    .slice(0, limit);
}
