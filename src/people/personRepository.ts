import type { SQLiteDatabase } from 'expo-sqlite';

import type { PersonType } from '@/constants/person';
import { createId } from '@/domain/ids';
import type { Person, PersonValues } from '@/domain/person';

type PersonRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  person_type: PersonType;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const PERSON_COLUMNS = 'id, name, phone, address, person_type, notes, created_at, updated_at';

function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    personType: row.person_type,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPeople(database: SQLiteDatabase): Promise<Person[]> {
  const rows = await database.getAllAsync<PersonRow>(
    `SELECT ${PERSON_COLUMNS} FROM people ORDER BY name COLLATE NOCASE, created_at`
  );
  return rows.map(toPerson);
}

export async function getPerson(database: SQLiteDatabase, id: string): Promise<Person | null> {
  const row = await database.getFirstAsync<PersonRow>(`SELECT ${PERSON_COLUMNS} FROM people WHERE id = ?`, [id]);
  return row ? toPerson(row) : null;
}

export async function insertPerson(database: SQLiteDatabase, values: PersonValues, timestamp: string): Promise<Person> {
  const person: Person = { id: createId(), ...values, createdAt: timestamp, updatedAt: timestamp };
  await database.runAsync(
    `INSERT INTO people (id, name, phone, address, person_type, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      person.id,
      person.name,
      person.phone,
      person.address,
      person.personType,
      person.notes,
      person.createdAt,
      person.updatedAt,
    ]
  );
  return person;
}

/** Tickets keep the name they were saved with, so a rename does not touch them. */
export async function updatePerson(
  database: SQLiteDatabase,
  id: string,
  values: PersonValues,
  timestamp: string
): Promise<void> {
  await database.runAsync(
    `UPDATE people
     SET name = ?, phone = ?, address = ?, person_type = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [values.name, values.phone, values.address, values.personType, values.notes, timestamp, id]
  );
}

export type PersonActivity = {
  purchaseCount: number;
  purchaseTotal: number;
  saleCount: number;
  saleTotal: number;
};

export async function getPersonActivity(database: SQLiteDatabase, id: string): Promise<PersonActivity> {
  const [purchases, sales] = await Promise.all([
    database.getFirstAsync<{ ticket_count: number; total: number | null }>(
      'SELECT COUNT(*) AS ticket_count, SUM(total_amount) AS total FROM purchases WHERE seller_id = ?',
      [id]
    ),
    database.getFirstAsync<{ ticket_count: number; total: number | null }>(
      'SELECT COUNT(*) AS ticket_count, SUM(total_amount) AS total FROM sales WHERE buyer_id = ?',
      [id]
    ),
  ]);

  return {
    purchaseCount: purchases?.ticket_count ?? 0,
    purchaseTotal: purchases?.total ?? 0,
    saleCount: sales?.ticket_count ?? 0,
    saleTotal: sales?.total ?? 0,
  };
}
