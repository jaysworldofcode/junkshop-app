import type { SQLiteDatabase } from 'expo-sqlite';

import { runInTransaction } from '@/db/runInTransaction';
import { formatSaleNumber, type NewSale, type SavedSale } from '@/domain/sale';

export async function saveSale(database: SQLiteDatabase, { sale, items }: NewSale): Promise<SavedSale> {
  let saleNumber = '';

  await runInTransaction(database, async (transaction) => {
    saleNumber = await nextSaleNumber(transaction, sale.saleDate);

    await transaction.runAsync(
      `INSERT INTO sales (
         id, sale_number, buyer_id, buyer_name, sale_date, subtotal, other_cost,
         total_amount, payment_status, payment_method, notes, created_at, updated_at
       ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.id,
        saleNumber,
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

async function nextSaleNumber(database: SQLiteDatabase, saleDate: string): Promise<string> {
  const row = await database.getFirstAsync<{ sale_count: number }>(
    'SELECT COUNT(*) AS sale_count FROM sales WHERE sale_date = ?',
    [saleDate]
  );

  return formatSaleNumber(saleDate, (row?.sale_count ?? 0) + 1);
}
