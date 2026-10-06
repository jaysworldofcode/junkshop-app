/** SQLite cannot alter a CHECK constraint, so the table is rebuilt with every existing row kept. */
export const MIGRATION_008_ADD_SUPPLIER_PRICE_TYPE = `
CREATE TABLE material_prices_next (
  id TEXT PRIMARY KEY NOT NULL,
  material_id TEXT NOT NULL REFERENCES materials (id),
  price_type TEXT NOT NULL CHECK (price_type IN ('buy', 'sell', 'supplier')),
  price INTEGER NOT NULL CHECK (price >= 0),
  effective_date TEXT NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO material_prices_next (
  id, material_id, price_type, price, effective_date, source, notes, created_at, updated_at
)
SELECT id, material_id, price_type, price, effective_date, source, notes, created_at, updated_at
FROM material_prices;

DROP TABLE material_prices;

ALTER TABLE material_prices_next RENAME TO material_prices;

CREATE INDEX IF NOT EXISTS idx_material_prices_current
  ON material_prices (material_id, price_type, effective_date, updated_at);
`;
