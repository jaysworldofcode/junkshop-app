import type { SQLiteDatabase } from 'expo-sqlite';

import { UNSETTLED_PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from '@/constants/payment';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import type { DateRange } from '@/domain/dateRange';
import { mergeTransactions, type PeriodTotals, type SaleDetail, type TransactionEntry } from '@/domain/dashboard';

const UNSETTLED_STATUS_SQL = UNSETTLED_PAYMENT_STATUSES.map((status) => `'${status}'`).join(', ');

type TicketTotalsRow = { ticket_count: number; total: number | null; unsettled_count: number | null };

export async function getPeriodTotals(database: SQLiteDatabase, { from, to }: DateRange): Promise<PeriodTotals> {
  const [purchases, sales, profit] = await Promise.all([
    database.getFirstAsync<TicketTotalsRow>(
      `SELECT COUNT(*) AS ticket_count, SUM(total_amount) AS total,
              SUM(CASE WHEN payment_status IN (${UNSETTLED_STATUS_SQL}) THEN 1 ELSE 0 END) AS unsettled_count
       FROM purchases
       WHERE purchase_date BETWEEN ? AND ?`,
      [from, to]
    ),
    database.getFirstAsync<TicketTotalsRow>(
      `SELECT COUNT(*) AS ticket_count, SUM(total_amount) AS total,
              SUM(CASE WHEN payment_status IN (${UNSETTLED_STATUS_SQL}) THEN 1 ELSE 0 END) AS unsettled_count
       FROM sales
       WHERE sale_date BETWEEN ? AND ?`,
      [from, to]
    ),
    database.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(si.actual_profit) AS total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.sale_date BETWEEN ? AND ?`,
      [from, to]
    ),
  ]);

  return {
    purchaseCount: purchases?.ticket_count ?? 0,
    purchaseTotal: purchases?.total ?? 0,
    saleCount: sales?.ticket_count ?? 0,
    saleTotal: sales?.total ?? 0,
    realizedProfit: profit?.total ?? 0,
    unsettledPurchases: purchases?.unsettled_count ?? 0,
    unsettledSales: sales?.unsettled_count ?? 0,
  };
}

type TransactionRow = {
  id: string;
  ticket_number: string;
  person_name: string | null;
  ticket_date: string;
  created_at: string;
  total_amount: number;
  profit: number | null;
  payment_status: PaymentStatus;
};

type MaterialNameRow = { ticket_id: string; material_name: string };

function groupNames(rows: MaterialNameRow[]): Map<string, string[]> {
  const names = new Map<string, string[]>();
  for (const row of rows) {
    names.set(row.ticket_id, [...(names.get(row.ticket_id) ?? []), row.material_name]);
  }
  return names;
}

export async function listTransactions(database: SQLiteDatabase, { from, to }: DateRange): Promise<TransactionEntry[]> {
  const [saleRows, saleNames, purchaseRows, purchaseNames] = await Promise.all([
    database.getAllAsync<TransactionRow>(
      `SELECT s.id, s.sale_number AS ticket_number, s.buyer_name AS person_name, s.sale_date AS ticket_date,
              s.created_at, s.total_amount, SUM(si.actual_profit) AS profit, s.payment_status
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE s.sale_date BETWEEN ? AND ?
       GROUP BY s.id`,
      [from, to]
    ),
    database.getAllAsync<MaterialNameRow>(
      `SELECT DISTINCT si.sale_id AS ticket_id, m.name AS material_name
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN materials m ON m.id = si.material_id
       WHERE s.sale_date BETWEEN ? AND ?
       ORDER BY m.name COLLATE NOCASE`,
      [from, to]
    ),
    database.getAllAsync<TransactionRow>(
      `SELECT id, purchase_number AS ticket_number, seller_name AS person_name, purchase_date AS ticket_date,
              created_at, total_amount, NULL AS profit, payment_status
       FROM purchases
       WHERE purchase_date BETWEEN ? AND ?`,
      [from, to]
    ),
    database.getAllAsync<MaterialNameRow>(
      `SELECT DISTINCT pi.purchase_id AS ticket_id, m.name AS material_name
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
       JOIN materials m ON m.id = pi.material_id
       WHERE p.purchase_date BETWEEN ? AND ?
       ORDER BY m.name COLLATE NOCASE`,
      [from, to]
    ),
  ]);

  const toEntries = (rows: TransactionRow[], names: Map<string, string[]>, kind: TransactionEntry['kind']) =>
    rows.map<TransactionEntry>((row) => ({
      kind,
      id: row.id,
      ticketNumber: row.ticket_number,
      personName: row.person_name ?? UNKNOWN_PERSON_NAME,
      date: row.ticket_date,
      createdAt: row.created_at,
      totalAmount: row.total_amount,
      profit: kind === 'sale' ? (row.profit ?? 0) : null,
      paymentStatus: row.payment_status,
      materialNames: names.get(row.id) ?? [],
    }));

  return mergeTransactions(
    toEntries(saleRows, groupNames(saleNames), 'sale'),
    toEntries(purchaseRows, groupNames(purchaseNames), 'purchase')
  );
}

type SaleHeaderRow = {
  id: string;
  sale_number: string;
  buyer_name: string | null;
  sale_date: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
};

type SaleItemRow = {
  id: string;
  material_name: string;
  unit: string;
  quantity: number;
  unit_sell_price: number;
  sale_total: number;
  allocated_purchase_cost: number;
  actual_profit: number;
};

export async function getSaleDetail(database: SQLiteDatabase, id: string): Promise<SaleDetail | null> {
  const header = await database.getFirstAsync<SaleHeaderRow>(
    `SELECT id, sale_number, buyer_name, sale_date, total_amount, payment_status, payment_method, notes
     FROM sales
     WHERE id = ?`,
    [id]
  );

  if (!header) {
    return null;
  }

  const items = await database.getAllAsync<SaleItemRow>(
    `SELECT si.id, m.name AS material_name, m.unit, si.quantity, si.unit_sell_price, si.sale_total,
            si.allocated_purchase_cost, si.actual_profit
     FROM sale_items si
     JOIN materials m ON m.id = si.material_id
     WHERE si.sale_id = ?
     ORDER BY si.created_at, si.rowid`,
    [id]
  );

  return {
    id: header.id,
    saleNumber: header.sale_number,
    buyerName: header.buyer_name ?? UNKNOWN_PERSON_NAME,
    saleDate: header.sale_date,
    totalAmount: header.total_amount,
    paymentStatus: header.payment_status,
    paymentMethod: header.payment_method,
    notes: header.notes,
    items: items.map((item) => ({
      id: item.id,
      materialName: item.material_name,
      unit: item.unit,
      quantity: item.quantity,
      unitSellPrice: item.unit_sell_price,
      saleTotal: item.sale_total,
      allocatedPurchaseCost: item.allocated_purchase_cost,
      actualProfit: item.actual_profit,
    })),
  };
}
