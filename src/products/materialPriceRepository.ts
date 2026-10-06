import type { SQLiteDatabase } from 'expo-sqlite';

import { PRICE_SOURCE_MANUAL, type PriceType } from '@/constants/price';
import { createId } from '@/domain/ids';
import type { LocalDateKey } from '@/domain/localDate';
import { NO_PRICES, type PriceChange, type ProductPrices } from '@/domain/materialPrice';

type CurrentPriceRow = {
  material_id: string;
  price_type: PriceType;
  price: number;
  effective_date: string;
};

export async function getCurrentPrices(database: SQLiteDatabase): Promise<Map<string, ProductPrices>> {
  const rows = await database.getAllAsync<CurrentPriceRow>(
    `SELECT material_id, price_type, price, effective_date
     FROM (
       SELECT material_id, price_type, price, effective_date,
              ROW_NUMBER() OVER (
                PARTITION BY material_id, price_type
                ORDER BY effective_date DESC, updated_at DESC
              ) AS price_rank
       FROM material_prices
     )
     WHERE price_rank = 1`
  );

  const pricesByMaterial = new Map<string, ProductPrices>();
  for (const row of rows) {
    const prices = pricesByMaterial.get(row.material_id) ?? { ...NO_PRICES };
    prices[row.price_type] = { price: row.price, effectiveDate: row.effective_date };
    pricesByMaterial.set(row.material_id, prices);
  }

  return pricesByMaterial;
}

export async function getProductPrices(database: SQLiteDatabase, materialId: string): Promise<ProductPrices> {
  const pricesByMaterial = await getCurrentPrices(database);
  return pricesByMaterial.get(materialId) ?? NO_PRICES;
}

/** Writes one manual price per material, type, and day. Run inside a transaction. */
export async function writePriceChanges(
  database: SQLiteDatabase,
  changes: PriceChange[],
  effectiveDate: LocalDateKey,
  timestamp: string
): Promise<void> {
  for (const change of changes) {
    const existing = await database.getFirstAsync<{ id: string }>(
      `SELECT id FROM material_prices
       WHERE material_id = ? AND price_type = ? AND effective_date = ? AND source = ?`,
      [change.materialId, change.priceType, effectiveDate, PRICE_SOURCE_MANUAL]
    );

    if (existing) {
      await database.runAsync('UPDATE material_prices SET price = ?, updated_at = ? WHERE id = ?', [
        change.price,
        timestamp,
        existing.id,
      ]);
      continue;
    }

    await database.runAsync(
      `INSERT INTO material_prices (
         id, material_id, price_type, price, effective_date, source, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [createId(), change.materialId, change.priceType, change.price, effectiveDate, PRICE_SOURCE_MANUAL, timestamp, timestamp]
    );
  }
}
