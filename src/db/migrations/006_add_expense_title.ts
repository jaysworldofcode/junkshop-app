import { EXPENSE_CATEGORY_LABELS } from '@/constants/expense';

const CATEGORY_LABEL_SQL = Object.entries(EXPENSE_CATEGORY_LABELS)
  .map(([category, label]) => `WHEN '${category}' THEN '${label.replace(/'/g, "''")}'`)
  .join(' ');

/** Replaces the optional description with a required title, keeping any description already typed. */
export const MIGRATION_006_ADD_EXPENSE_TITLE = `
ALTER TABLE expenses ADD COLUMN title TEXT NOT NULL DEFAULT '';

UPDATE expenses
SET title = COALESCE(
  NULLIF(TRIM(description), ''),
  CASE category ${CATEGORY_LABEL_SQL} ELSE category END
);

ALTER TABLE expenses DROP COLUMN description;
`;
