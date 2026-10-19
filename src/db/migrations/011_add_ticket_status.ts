/** Every saved ticket starts active. A cancelled ticket keeps its rows so it can be restored. */
export const MIGRATION_011_ADD_TICKET_STATUS = `
ALTER TABLE purchases ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
ALTER TABLE purchases ADD COLUMN cancelled_at TEXT;
ALTER TABLE sales ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
ALTER TABLE sales ADD COLUMN cancelled_at TEXT;
`;
