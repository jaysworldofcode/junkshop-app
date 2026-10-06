export const MIGRATION_002_CREATE_PURCHASES = `
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY NOT NULL,
  purchase_number TEXT NOT NULL,
  seller_id TEXT,
  seller_name TEXT,
  purchase_date TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  other_cost INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_date
  ON purchases (purchase_date, created_at);

CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY NOT NULL,
  purchase_id TEXT NOT NULL REFERENCES purchases (id),
  material_id TEXT NOT NULL REFERENCES materials (id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_buy_price INTEGER NOT NULL CHECK (unit_buy_price >= 0),
  purchase_total INTEGER NOT NULL,
  supplier_price INTEGER,
  planned_sell_quantity INTEGER,
  expected_sell_total INTEGER,
  expected_profit INTEGER,
  supplier_id TEXT,
  supplier_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('unrealized', 'partial', 'sold', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase
  ON purchase_items (purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_status
  ON purchase_items (status, material_id);
`;
