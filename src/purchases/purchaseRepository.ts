import type { SQLiteDatabase } from 'expo-sqlite';

import type { PaymentMethod, PaymentStatus } from '@/constants/payment';
import {
  UNKNOWN_PERSON_NAME,
  UNSOLD_PURCHASE_ITEM_STATUSES,
  type PurchaseItemStatus,
} from '@/constants/purchase';
import { runInTransaction } from '@/db/runInTransaction';
import { formatPurchaseNumber, type NewPurchase, type SavedPurchase } from '@/domain/purchase';
import type { PurchaseDetail, PurchaseListEntry } from '@/domain/purchaseHistory';

export async function savePurchase(database: SQLiteDatabase, { purchase, items }: NewPurchase): Promise<SavedPurchase> {
  let purchaseNumber = '';

  await runInTransaction(database, async (transaction) => {
    purchaseNumber = await nextPurchaseNumber(transaction, purchase.purchaseDate);

    await transaction.runAsync(
      `INSERT INTO purchases (
         id, purchase_number, seller_id, seller_name, purchase_date, subtotal, other_cost,
         total_amount, payment_status, payment_method, notes, created_at, updated_at
       ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchase.id,
        purchaseNumber,
        purchase.sellerName,
        purchase.purchaseDate,
        purchase.subtotal,
        purchase.otherCost,
        purchase.totalAmount,
        purchase.paymentStatus,
        purchase.paymentMethod,
        purchase.notes,
        purchase.createdAt,
        purchase.updatedAt,
      ]
    );

    for (const item of items) {
      await transaction.runAsync(
        `INSERT INTO purchase_items (
           id, purchase_id, material_id, quantity, unit_buy_price, purchase_total, supplier_price,
           planned_sell_quantity, expected_sell_total, expected_profit, supplier_id, supplier_name,
           status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        [
          item.id,
          item.purchaseId,
          item.materialId,
          item.quantity,
          item.unitBuyPrice,
          item.purchaseTotal,
          item.supplierPrice,
          item.plannedSellQuantity,
          item.expectedSellTotal,
          item.expectedProfit,
          item.supplierName,
          item.status,
          item.createdAt,
          item.updatedAt,
        ]
      );
    }
  });

  return {
    id: purchase.id,
    purchaseNumber,
    sellerName: purchase.sellerName,
    totalAmount: purchase.totalAmount,
    lineCount: items.length,
  };
}

type PurchaseListRow = {
  id: string;
  purchase_number: string;
  seller_name: string | null;
  purchase_date: string;
  total_amount: number;
  payment_status: PaymentStatus;
  line_count: number;
  unsold_line_count: number;
};

type PurchaseMaterialRow = {
  purchase_id: string;
  material_name: string;
};

const UNSOLD_STATUS_SQL = UNSOLD_PURCHASE_ITEM_STATUSES.map((status) => `'${status}'`).join(', ');

export async function listPurchases(database: SQLiteDatabase): Promise<PurchaseListEntry[]> {
  const [rows, materialRows] = await Promise.all([
    database.getAllAsync<PurchaseListRow>(
      `SELECT p.id, p.purchase_number, p.seller_name, p.purchase_date, p.total_amount, p.payment_status,
              COUNT(pi.id) AS line_count,
              SUM(CASE WHEN pi.status IN (${UNSOLD_STATUS_SQL}) THEN 1 ELSE 0 END) AS unsold_line_count
       FROM purchases p
       LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
       GROUP BY p.id
       ORDER BY p.purchase_date DESC, p.created_at DESC`
    ),
    database.getAllAsync<PurchaseMaterialRow>(
      `SELECT DISTINCT pi.purchase_id, m.name AS material_name
       FROM purchase_items pi
       JOIN materials m ON m.id = pi.material_id
       ORDER BY m.name COLLATE NOCASE`
    ),
  ]);

  const namesByPurchase = new Map<string, string[]>();
  for (const row of materialRows) {
    namesByPurchase.set(row.purchase_id, [...(namesByPurchase.get(row.purchase_id) ?? []), row.material_name]);
  }

  return rows.map((row) => ({
    id: row.id,
    purchaseNumber: row.purchase_number,
    sellerName: row.seller_name ?? UNKNOWN_PERSON_NAME,
    purchaseDate: row.purchase_date,
    totalAmount: row.total_amount,
    paymentStatus: row.payment_status,
    lineCount: row.line_count,
    unsoldLineCount: row.unsold_line_count ?? 0,
    materialNames: namesByPurchase.get(row.id) ?? [],
  }));
}

type PurchaseHeaderRow = {
  id: string;
  purchase_number: string;
  seller_name: string | null;
  purchase_date: string;
  subtotal: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
};

type PurchaseItemRow = {
  id: string;
  material_name: string;
  unit: string;
  quantity: number;
  unit_buy_price: number;
  purchase_total: number;
  supplier_price: number | null;
  expected_sell_total: number | null;
  expected_profit: number | null;
  supplier_name: string | null;
  status: PurchaseItemStatus;
};

export async function getPurchaseDetail(database: SQLiteDatabase, id: string): Promise<PurchaseDetail | null> {
  const header = await database.getFirstAsync<PurchaseHeaderRow>(
    `SELECT id, purchase_number, seller_name, purchase_date, subtotal, total_amount,
            payment_status, payment_method, notes, created_at
     FROM purchases
     WHERE id = ?`,
    [id]
  );

  if (!header) {
    return null;
  }

  const items = await database.getAllAsync<PurchaseItemRow>(
    `SELECT pi.id, m.name AS material_name, m.unit, pi.quantity, pi.unit_buy_price, pi.purchase_total,
            pi.supplier_price, pi.expected_sell_total, pi.expected_profit, pi.supplier_name, pi.status
     FROM purchase_items pi
     JOIN materials m ON m.id = pi.material_id
     WHERE pi.purchase_id = ?
     ORDER BY pi.created_at, pi.rowid`,
    [id]
  );

  return {
    id: header.id,
    purchaseNumber: header.purchase_number,
    sellerName: header.seller_name ?? UNKNOWN_PERSON_NAME,
    purchaseDate: header.purchase_date,
    subtotal: header.subtotal,
    totalAmount: header.total_amount,
    paymentStatus: header.payment_status,
    paymentMethod: header.payment_method,
    notes: header.notes,
    createdAt: header.created_at,
    items: items.map((item) => ({
      id: item.id,
      materialName: item.material_name,
      unit: item.unit,
      quantity: item.quantity,
      unitBuyPrice: item.unit_buy_price,
      purchaseTotal: item.purchase_total,
      supplierPrice: item.supplier_price,
      expectedSellTotal: item.expected_sell_total,
      expectedProfit: item.expected_profit,
      plannedBuyer: item.supplier_name,
      status: item.status,
    })),
  };
}

async function nextPurchaseNumber(database: SQLiteDatabase, purchaseDate: string): Promise<string> {
  const row = await database.getFirstAsync<{ purchase_count: number }>(
    'SELECT COUNT(*) AS purchase_count FROM purchases WHERE purchase_date = ?',
    [purchaseDate]
  );

  return formatPurchaseNumber(purchaseDate, (row?.purchase_count ?? 0) + 1);
}
