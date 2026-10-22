import type { SQLiteDatabase } from 'expo-sqlite';

import { SALE_NUMBER_PREFIX } from '@/constants/sale';
import type { TicketStatus } from '@/constants/transaction';
import { runInTransaction } from '@/db/runInTransaction';
import type { LocalDateKey } from '@/domain/localDate';
import type { TicketPerson } from '@/domain/person';
import { formatSaleNumber, type NewSale, type SavedSale } from '@/domain/sale';
import { nextTicketSequence, ticketNumberStem } from '@/domain/ticketNumber';

export async function saveSale(database: SQLiteDatabase, { sale, items }: NewSale): Promise<SavedSale> {
  let saleNumber = '';

  await runInTransaction(database, async (transaction) => {
    saleNumber = await nextSaleNumber(transaction, sale.saleDate);

    await transaction.runAsync(
      `INSERT INTO sales (
         id, sale_number, buyer_id, buyer_name, sale_date, subtotal, other_cost,
         total_amount, payment_status, payment_method, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.id,
        saleNumber,
        sale.buyerId,
        sale.buyerName,
        sale.saleDate,
        sale.subtotal,
        sale.otherCost,
        sale.totalAmount,
        sale.paymentStatus,
        sale.paymentMethod,
        sale.notes,
        sale.createdAt,
        sale.updatedAt,
      ]
    );

    for (const item of items) {
      await transaction.runAsync(
        `INSERT INTO sale_items (
           id, sale_id, purchase_item_id, material_id, quantity, unit_sell_price, sale_total,
           allocated_purchase_cost, actual_profit, created_at, updated_at
         ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.saleId,
          item.materialId,
          item.quantity,
          item.unitSellPrice,
          item.saleTotal,
          item.allocatedPurchaseCost,
          item.actualProfit,
          item.createdAt,
          item.updatedAt,
        ]
      );
    }
  });

  return {
    id: sale.id,
    saleNumber,
    buyerName: sale.buyerName,
    totalAmount: sale.totalAmount,
    actualProfit: items.reduce((sum, item) => sum + item.actualProfit, 0),
    lineCount: items.length,
  };
}

export async function updateSaleBuyer(
  database: SQLiteDatabase,
  id: string,
  { personId, name }: TicketPerson,
  timestamp: string
): Promise<void> {
  await database.runAsync('UPDATE sales SET buyer_id = ?, buyer_name = ?, updated_at = ? WHERE id = ?', [
    personId,
    name,
    timestamp,
    id,
  ]);
}

export async function setSaleStatus(
  database: SQLiteDatabase,
  id: string,
  status: TicketStatus,
  timestamp: string
): Promise<void> {
  await database.runAsync('UPDATE sales SET status = ?, cancelled_at = ?, updated_at = ? WHERE id = ?', [
    status,
    status === 'cancelled' ? timestamp : null,
    timestamp,
    id,
  ]);
}

export async function updateSaleDate(
  database: SQLiteDatabase,
  id: string,
  saleDate: LocalDateKey,
  timestamp: string
): Promise<void> {
  await database.runAsync('UPDATE sales SET sale_date = ?, updated_at = ? WHERE id = ?', [saleDate, timestamp, id]);
}

async function nextSaleNumber(database: SQLiteDatabase, saleDate: string): Promise<string> {
  const stem = ticketNumberStem(SALE_NUMBER_PREFIX, saleDate);
  const [used, counted] = await Promise.all([
    database.getFirstAsync<{ highest: number | null }>(
      'SELECT MAX(CAST(substr(sale_number, ?) AS INTEGER)) AS highest FROM sales WHERE sale_number LIKE ?',
      [stem.length + 1, `${stem}%`]
    ),
    database.getFirstAsync<{ sale_count: number }>('SELECT COUNT(*) AS sale_count FROM sales WHERE sale_date = ?', [
      saleDate,
    ]),
  ]);

  return formatSaleNumber(saleDate, nextTicketSequence(used?.highest ?? null, counted?.sale_count ?? 0));
}
