import { EXPENSE_CATEGORIES, EXPENSE_TITLE_MAX_LENGTH, type ExpenseCategory } from '@/constants/expense';
import { DEFAULT_PAYMENT_METHOD, type PaymentMethod } from '@/constants/payment';
import { NOTES_MAX_LENGTH } from '@/constants/purchase';
import type { LocalDateKey } from '@/domain/localDate';
import { formatPesoInput, parsePesoInput } from '@/domain/money';
import { optionalText } from '@/domain/text';

export type Expense = {
  id: string;
  expenseDate: LocalDateKey;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseDraft = {
  expenseDate: LocalDateKey;
  category: ExpenseCategory | '';
  amount: string;
  paymentMethod: PaymentMethod;
  title: string;
  notes: string;
};

export type ExpenseField = keyof ExpenseDraft;
export type ExpenseErrors = Partial<Record<ExpenseField, string>>;

/** The fields a save writes. id and created_at are set by the repository on insert. */
export type ExpenseValues = Pick<Expense, 'expenseDate' | 'category' | 'title' | 'amount' | 'paymentMethod' | 'notes'>;

export type ExpenseDaySection = {
  expenseDate: LocalDateKey;
  dayTotal: number;
  data: Expense[];
};

/** Expects expenses already sorted newest first. */
export function groupExpensesByDay(expenses: Expense[]): ExpenseDaySection[] {
  const sections: ExpenseDaySection[] = [];

  for (const expense of expenses) {
    const current = sections.at(-1);
    if (current && current.expenseDate === expense.expenseDate) {
      current.data.push(expense);
      current.dayTotal += expense.amount;
    } else {
      sections.push({ expenseDate: expense.expenseDate, dayTotal: expense.amount, data: [expense] });
    }
  }

  return sections;
}

export function createEmptyExpenseDraft(expenseDate: LocalDateKey): ExpenseDraft {
  return {
    expenseDate,
    category: '',
    amount: '',
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    title: '',
    notes: '',
  };
}

export function draftFromExpense(expense: Expense): ExpenseDraft {
  return {
    expenseDate: expense.expenseDate,
    category: expense.category,
    amount: formatPesoInput(expense.amount),
    paymentMethod: expense.paymentMethod,
    title: expense.title,
    notes: expense.notes ?? '',
  };
}

function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function validateExpenseDraft(draft: ExpenseDraft): ExpenseErrors {
  const errors: ExpenseErrors = {};
  const amount = parsePesoInput(draft.amount);

  if (!isExpenseCategory(draft.category)) {
    errors.category = 'Pick a category.';
  }

  if (draft.amount.trim().length === 0) {
    errors.amount = 'Enter the amount.';
  } else if (amount === null) {
    errors.amount = 'Use a peso amount, like 5000 or 250.50.';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be more than ₱0.';
  }

  const title = draft.title.trim();
  if (title.length === 0) {
    errors.title = 'Enter a title, like Diesel for the truck.';
  } else if (title.length > EXPENSE_TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${EXPENSE_TITLE_MAX_LENGTH} characters or fewer.`;
  }

  if (draft.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}

export function hasExpenseErrors(errors: ExpenseErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/** Expects a draft that already passed validateExpenseDraft. */
export function expenseValuesFromDraft(draft: ExpenseDraft): ExpenseValues {
  const amount = parsePesoInput(draft.amount);
  if (amount === null || !isExpenseCategory(draft.category)) {
    throw new Error('Expense is incomplete.');
  }

  return {
    expenseDate: draft.expenseDate,
    category: draft.category,
    title: draft.title.trim(),
    amount,
    paymentMethod: draft.paymentMethod,
    notes: optionalText(draft.notes),
  };
}
