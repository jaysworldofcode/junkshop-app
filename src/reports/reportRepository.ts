import type { SQLiteDatabase } from 'expo-sqlite';

import type { ExpenseCategory } from '@/constants/expense';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import { REPORT_TOP_PEOPLE_LIMIT } from '@/constants/report';
import { getPeriodTotals } from '@/dashboard/dashboardRepository';
import type { DateRange } from '@/domain/dateRange';
import {
  previousRange,
  type DailyFigures,
  type ExpenseCategoryTotal,
  type MaterialPerformance,
  type PersonTotal,
  type ReportData,
} from '@/domain/report';

type MaterialSoldRow = {
  material_id: string;
  name: string;
  unit: string;
  quantity: number;
  sales_total: number;
  cost_total: number;
  profit: number;
};

type MaterialBoughtRow = {
  material_id: string;
  name: string;
  unit: string;
  quantity: number;
  purchase_total: number;
};

type PersonRow = { name: string; ticket_count: number; total: number };
type CategoryRow = { category: ExpenseCategory; total: number };
type DayAmountRow = { day: string; total: number };

async function listMaterialPerformance(database: SQLiteDatabase, { from, to }: DateRange): Promise<MaterialPerformance[]> {
  const [sold, bought] = await Promise.all([
    database.getAllAsync<MaterialSoldRow>(
      `SELECT m.id AS material_id, m.name, m.unit,
              SUM(si.quantity) AS quantity, SUM(si.sale_total) AS sales_total,
              SUM(si.allocated_purchase_cost) AS cost_total, SUM(si.actual_profit) AS profit
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN materials m ON m.id = si.material_id
       WHERE s.sale_date BETWEEN ? AND ?
       GROUP BY m.id`,
      [from, to]
    ),
    database.getAllAsync<MaterialBoughtRow>(
      `SELECT m.id AS material_id, m.name, m.unit,
              SUM(pi.quantity) AS quantity, SUM(pi.purchase_total) AS purchase_total
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
       JOIN materials m ON m.id = pi.material_id
       WHERE p.purchase_date BETWEEN ? AND ?
       GROUP BY m.id`,
      [from, to]
    ),
  ]);

  const materials = new Map<string, MaterialPerformance>();
  const materialFor = (row: { material_id: string; name: string; unit: string }) =>
    materials.get(row.material_id) ?? {
      materialId: row.material_id,
      name: row.name,
      unit: row.unit,
      quantitySold: 0,
      salesTotal: 0,
      costTotal: 0,
      profit: 0,
      quantityBought: 0,
      purchaseTotal: 0,
    };

  for (const row of sold) {
    materials.set(row.material_id, {
      ...materialFor(row),
      quantitySold: row.quantity,
      salesTotal: row.sales_total,
      costTotal: row.cost_total,
      profit: row.profit,
    });
  }

  for (const row of bought) {
    materials.set(row.material_id, {
      ...materialFor(row),
      quantityBought: row.quantity,
      purchaseTotal: row.purchase_total,
    });
  }

  return [...materials.values()];
}

function toPeople(rows: PersonRow[]): PersonTotal[] {
  return rows.map((row) => ({ name: row.name, ticketCount: row.ticket_count, total: row.total }));
}

async function listDailyFigures(database: SQLiteDatabase, { from, to }: DateRange): Promise<DailyFigures[]> {
  const [sales, purchases, profit, expenses] = await Promise.all([
    database.getAllAsync<DayAmountRow>(
      'SELECT sale_date AS day, SUM(total_amount) AS total FROM sales WHERE sale_date BETWEEN ? AND ? GROUP BY sale_date',
      [from, to]
    ),
    database.getAllAsync<DayAmountRow>(
      'SELECT purchase_date AS day, SUM(total_amount) AS total FROM purchases WHERE purchase_date BETWEEN ? AND ? GROUP BY purchase_date',
      [from, to]
    ),
    database.getAllAsync<DayAmountRow>(
      `SELECT s.sale_date AS day, SUM(si.actual_profit) AS total
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.sale_date BETWEEN ? AND ?
       GROUP BY s.sale_date`,
      [from, to]
    ),
    database.getAllAsync<DayAmountRow>(
      'SELECT expense_date AS day, SUM(amount) AS total FROM expenses WHERE expense_date BETWEEN ? AND ? GROUP BY expense_date',
      [from, to]
    ),
  ]);

  const days = new Map<string, DailyFigures>();
  const add = (rows: DayAmountRow[], field: Exclude<keyof DailyFigures, 'date'>) => {
    for (const row of rows) {
      const day = days.get(row.day) ?? { date: row.day, sales: 0, purchases: 0, profit: 0, expenses: 0 };
      day[field] += row.total;
      days.set(row.day, day);
    }
  };

  add(sales, 'sales');
  add(purchases, 'purchases');
  add(profit, 'profit');
  add(expenses, 'expenses');

  return [...days.values()];
}

export async function getReport(database: SQLiteDatabase, range: DateRange): Promise<ReportData> {
  const earlier = previousRange(range);
  const { from, to } = range;

  const [current, previous, materials, buyers, sellers, categories, daily, belowCost] = await Promise.all([
    getPeriodTotals(database, range),
    getPeriodTotals(database, earlier),
    listMaterialPerformance(database, range),
    database.getAllAsync<PersonRow>(
      `SELECT COALESCE(NULLIF(TRIM(buyer_name), ''), ?) AS name, COUNT(*) AS ticket_count, SUM(total_amount) AS total
       FROM sales
       WHERE sale_date BETWEEN ? AND ?
       GROUP BY name
       ORDER BY total DESC
       LIMIT ?`,
      [UNKNOWN_PERSON_NAME, from, to, REPORT_TOP_PEOPLE_LIMIT]
    ),
    database.getAllAsync<PersonRow>(
      `SELECT TRIM(seller_name) AS name, COUNT(*) AS ticket_count, SUM(total_amount) AS total
       FROM purchases
       WHERE purchase_date BETWEEN ? AND ?
         AND TRIM(COALESCE(seller_name, '')) <> ''
         AND LOWER(TRIM(seller_name)) <> LOWER(?)
       GROUP BY name
       ORDER BY total DESC
       LIMIT ?`,
      [from, to, UNKNOWN_PERSON_NAME, REPORT_TOP_PEOPLE_LIMIT]
    ),
    database.getAllAsync<CategoryRow>(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE expense_date BETWEEN ? AND ?
       GROUP BY category
       ORDER BY total DESC`,
      [from, to]
    ),
    listDailyFigures(database, range),
    database.getFirstAsync<{ line_count: number }>(
      `SELECT COUNT(*) AS line_count
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.sale_date BETWEEN ? AND ? AND si.actual_profit < 0`,
      [from, to]
    ),
  ]);

  const expensesByCategory: ExpenseCategoryTotal[] = categories.map((row) => ({
    category: row.category,
    total: row.total,
  }));

  return {
    range,
    previousRange: earlier,
    current,
    previous,
    materials,
    topBuyers: toPeople(buyers),
    topSellers: toPeople(sellers),
    expensesByCategory,
    daily,
    linesBelowCost: belowCost?.line_count ?? 0,
  };
}
