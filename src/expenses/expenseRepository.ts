import type { SQLiteDatabase } from 'expo-sqlite';

import type { ExpenseCategory } from '@/constants/expense';
import type { PaymentMethod } from '@/constants/payment';
import type { Expense, ExpenseValues } from '@/domain/expense';
import { createId } from '@/domain/ids';

type ExpenseRow = {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const EXPENSE_COLUMNS = 'id, expense_date, category, title, amount, payment_method, notes, created_at, updated_at';

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    expenseDate: row.expense_date,
    category: row.category,
    title: row.title,
    amount: row.amount,
    paymentMethod: row.payment_method,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listExpenses(database: SQLiteDatabase): Promise<Expense[]> {
  const rows = await database.getAllAsync<ExpenseRow>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses ORDER BY expense_date DESC, created_at DESC`
  );
  return rows.map(toExpense);
}

export async function getExpense(database: SQLiteDatabase, id: string): Promise<Expense | null> {
  const row = await database.getFirstAsync<ExpenseRow>(`SELECT ${EXPENSE_COLUMNS} FROM expenses WHERE id = ?`, [id]);
  return row ? toExpense(row) : null;
}

export async function insertExpense(database: SQLiteDatabase, values: ExpenseValues, timestamp: string): Promise<string> {
  const id = createId();
  await database.runAsync(
    `INSERT INTO expenses (
       id, expense_date, category, title, amount, payment_method, receipt_url, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    [id, values.expenseDate, values.category, values.title, values.amount, values.paymentMethod, values.notes, timestamp, timestamp]
  );
  return id;
}

export async function updateExpense(
  database: SQLiteDatabase,
  id: string,
  values: ExpenseValues,
  timestamp: string
): Promise<void> {
  await database.runAsync(
    `UPDATE expenses
     SET expense_date = ?, category = ?, title = ?, amount = ?, payment_method = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [values.expenseDate, values.category, values.title, values.amount, values.paymentMethod, values.notes, timestamp, id]
  );
}
