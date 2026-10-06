export const EXPENSE_CATEGORIES = [
  'wages',
  'transport',
  'electricity',
  'water',
  'rent',
  'food',
  'repairs',
  'supplies',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  wages: 'Wages',
  transport: 'Transport & fuel',
  electricity: 'Electricity',
  water: 'Water',
  rent: 'Rent',
  food: 'Food',
  repairs: 'Repairs',
  supplies: 'Supplies',
  other: 'Other',
};

export const EXPENSE_TITLE_MAX_LENGTH = 120;
