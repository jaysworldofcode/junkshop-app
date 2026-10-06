export const MIGRATION_003_CREATE_MATERIAL_PRICES = `
CREATE TABLE IF NOT EXISTS material_prices (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL REFERENCES materials (id),
  price_type TEXT NOT NULL CHECK (price_type IN ('buy', 'sell')),
  price INTEGER NOT NULL CHECK (price >= 0),
  effective_date TEXT NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_material_prices_current
  ON material_prices (material_id, price_type, effective_date, updated_at);
`;
