import type { SQLiteDatabase } from 'expo-sqlite';

import { TICKET_PRICE_DAY_LIMIT, type PriceType } from '@/constants/price';
import { linkPreviousPrices, type PriceChangeEntry, type TicketPriceDay } from '@/domain/priceHistory';
import { unitPriceFor } from '@/domain/quantity';

type PriceChangeRow = {
  id: string;
  price_type: PriceType;
  price: number;
  effective_date: string;
};

export async function listPriceChanges(database: SQLiteDatabase, materialId: string): Promise<PriceChangeEntry[]> {
  const rows = await database.getAllAsync<PriceChangeRow>(
    `SELECT id, price_type, price, effective_date
     FROM material_prices
     WHERE material_id = ?
     ORDER BY effective_date DESC, updated_at DESC`,
    [materialId]
  );

  return linkPreviousPrices(
    rows.map((row) => ({ id: row.id, priceType: row.price_type, price: row.price, effectiveDate: row.effective_date }))
  );
}

type TicketDayRow = {
  ticket_date: string;
  total: number;
  quantity: number;
};

/** Average prices actually paid and received per day, most recent days first. */
export async function listTicketPrices(database: SQLiteDatabase, materialId: string): Promise<TicketPriceDay[]> {
  const [bought, sold] = await Promise.all([
    database.getAllAsync<TicketDayRow>(
      `SELECT p.purchase_date AS ticket_date, SUM(pi.purchase_total) AS total, SUM(pi.quantity) AS quantity
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
       WHERE pi.material_id = ?
       GROUP BY p.purchase_date
       ORDER BY p.purchase_date DESC
       LIMIT ?`,
      [materialId, TICKET_PRICE_DAY_LIMIT]
    ),
    database.getAllAsync<TicketDayRow>(
      `SELECT s.sale_date AS ticket_date, SUM(si.sale_total) AS total, SUM(si.quantity) AS quantity
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE si.material_id = ?
       GROUP BY s.sale_date
       ORDER BY s.sale_date DESC
       LIMIT ?`,
      [materialId, TICKET_PRICE_DAY_LIMIT]
    ),
  ]);

  const days = new Map<string, TicketPriceDay>();
  const dayFor = (date: string) =>
    days.get(date) ?? { date, averageBuyPrice: null, quantityBought: 0, averageSellPrice: null, quantitySold: 0 };

  for (const row of bought) {
    days.set(row.ticket_date, {
      ...dayFor(row.ticket_date),
      averageBuyPrice: unitPriceFor(row.total, row.quantity),
      quantityBought: row.quantity,
    });
  }

  for (const row of sold) {
    days.set(row.ticket_date, {
      ...dayFor(row.ticket_date),
      averageSellPrice: unitPriceFor(row.total, row.quantity),
      quantitySold: row.quantity,
    });
  }

  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, TICKET_PRICE_DAY_LIMIT);
}
