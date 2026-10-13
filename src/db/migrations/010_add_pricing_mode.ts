/** Existing products stay per kilo or per piece. Pakyaw products are bought and sold by a lump sum. */
export const MIGRATION_010_ADD_PRICING_MODE = `
ALTER TABLE materials ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'per_unit';
`;
