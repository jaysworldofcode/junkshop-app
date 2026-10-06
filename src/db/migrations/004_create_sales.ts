export const MIGRATION_004_CREATE_SALES = `
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY NOT NULL,
  sale_number TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT,
  sale_date TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  other_cost INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sales_date
  ON sales (sale_date, created_at);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales (id),
  purchase_item_id TEXT REFERENCES purchase_items (id),
  material_id TEXT NOT NULL REFERENCES materials (id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_sell_price INTEGER NOT NULL CHECK (unit_sell_price >= 0),
  sale_total INTEGER NOT NULL,
  allocated_purchase_cost INTEGER NOT NULL,
  actual_profit INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale
  ON sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_purchase_item
  ON sale_items (purchase_item_id);
`;
