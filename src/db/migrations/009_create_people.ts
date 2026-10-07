export const MIGRATION_009_CREATE_PEOPLE = `
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  person_type TEXT NOT NULL CHECK (person_type IN ('seller', 'buyer', 'both', 'destination')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_people_name
  ON people (name COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_purchases_seller
  ON purchases (seller_id);

CREATE INDEX IF NOT EXISTS idx_sales_buyer
  ON sales (buyer_id, sale_date);
`;
