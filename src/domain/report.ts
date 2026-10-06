import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/constants/expense';
import { UNKNOWN_PERSON_NAME } from '@/constants/purchase';
import {
  MS_PER_DAY,
  PERCENT_FRACTION_DIGITS,
  PERCENT_SCALE,
  TREND_DAILY_MAX_DAYS,
  TREND_WEEKLY_MAX_DAYS,
  type InsightTone,
  type TrendGranularity,
} from '@/constants/report';
import type { PeriodTotals } from '@/domain/dashboard';
import { startOfMonth, startOfWeek, type DateRange } from '@/domain/dateRange';
import { addDays, formatDateLabel, parseLocalDateKey, type LocalDateKey } from '@/domain/localDate';
import { formatPeso } from '@/domain/money';
import { formatQuantity, unitPriceFor } from '@/domain/quantity';

export type MaterialPerformance = {
  materialId: string;
  name: string;
  unit: string;
  quantitySold: number;
  salesTotal: number;
  costTotal: number;
  profit: number;
  quantityBought: number;
  purchaseTotal: number;
};

export type PersonTotal = {
  name: string;
  ticketCount: number;
  total: number;
};

export type ExpenseCategoryTotal = {
  category: ExpenseCategory;
  total: number;
};

export type DailyFigures = {
  date: LocalDateKey;
  sales: number;
  purchases: number;
  profit: number;
  expenses: number;
};

export type TrendBucket = {
  key: LocalDateKey;
  label: string;
  sales: number;
  purchases: number;
  netProfit: number;
};

export type ReportData = {
  range: DateRange;
  previousRange: DateRange;
  current: PeriodTotals;
  previous: PeriodTotals;
  materials: MaterialPerformance[];
  topBuyers: PersonTotal[];
  topSellers: PersonTotal[];
  expensesByCategory: ExpenseCategoryTotal[];
  daily: DailyFigures[];
  linesBelowCost: number;
};

export type Insight = {
  tone: InsightTone;
  text: string;
};

export function daysInRange({ from, to }: DateRange): number {
  return Math.round((parseLocalDateKey(to).getTime() - parseLocalDateKey(from).getTime()) / MS_PER_DAY) + 1;
}

/** The period of the same length that ends the day before this one starts. */
export function previousRange(range: DateRange): DateRange {
  const length = daysInRange(range);
  return { from: addDays(range.from, -length), to: addDays(range.from, -1) };
}

/** Null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / Math.abs(previous)) * PERCENT_SCALE;
}

/** Profit as a share of sales, in percent. Null when nothing was sold. */
export function marginPercent(profit: number, sales: number): number | null {
  return sales > 0 ? (profit / sales) * PERCENT_SCALE : null;
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(PERCENT_FRACTION_DIGITS)}%`;
}

export function averageBuyPrice(material: MaterialPerformance): number | null {
  return unitPriceFor(material.purchaseTotal, material.quantityBought);
}

export function averageSellPrice(material: MaterialPerformance): number | null {
  return unitPriceFor(material.salesTotal, material.quantitySold);
}

export function trendGranularityFor(range: DateRange): TrendGranularity {
  const days = daysInRange(range);
  if (days <= TREND_DAILY_MAX_DAYS) {
    return 'day';
  }
  return days <= TREND_WEEKLY_MAX_DAYS ? 'week' : 'month';
}

function bucketKeyFor(date: LocalDateKey, granularity: TrendGranularity): LocalDateKey {
  switch (granularity) {
    case 'day':
      return date;
    case 'week':
      return startOfWeek(date);
    case 'month':
      return startOfMonth(date);
  }
}

/** One bucket per day, week, or month in the range, including empty ones, oldest first. */
export function buildTrend(range: DateRange, daily: DailyFigures[], granularity: TrendGranularity): TrendBucket[] {
  const buckets = new Map<LocalDateKey, TrendBucket>();

  for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
    const key = bucketKeyFor(date, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: formatDateLabel(key), sales: 0, purchases: 0, netProfit: 0 });
    }
  }

  for (const day of daily) {
    const bucket = buckets.get(bucketKeyFor(day.date, granularity));
    if (bucket) {
      bucket.sales += day.sales;
      bucket.purchases += day.purchases;
      bucket.netProfit += day.profit - day.expenses;
    }
  }

  return [...buckets.values()];
}

/** Materials that were sold, best profit first. */
export function rankByProfit(materials: MaterialPerformance[]): MaterialPerformance[] {
  return materials.filter((material) => material.quantitySold > 0).sort((a, b) => b.profit - a.profit);
}

function changePhrase(current: number, previous: number): string | null {
  const change = percentChange(current, previous);
  if (change === null || change === 0) {
    return null;
  }
  return `${change > 0 ? 'up' : 'down'} ${formatPercent(Math.abs(change))}`;
}

function isNamedPerson(person: PersonTotal): boolean {
  return person.name !== UNKNOWN_PERSON_NAME;
}

export function buildInsights(report: ReportData): Insight[] {
  const { current, previous } = report;
  const insights: Insight[] = [];
  const periodDays = daysInRange(report.range);

  if (current.saleCount === 0 && current.purchaseCount === 0 && current.expenseCount === 0) {
    return [{ tone: 'info', text: 'No sales, purchases, or expenses in this period yet.' }];
  }

  const salesChange = changePhrase(current.saleTotal, previous.saleTotal);
  if (salesChange) {
    insights.push({
      tone: current.saleTotal >= previous.saleTotal ? 'good' : 'warning',
      text: `Sales are ${salesChange} from the previous ${periodDays} day${periodDays === 1 ? '' : 's'} (${formatPeso(previous.saleTotal)} → ${formatPeso(current.saleTotal)}).`,
    });
  }

  const profitChange = changePhrase(current.netProfit, previous.netProfit);
  if (profitChange) {
    insights.push({
      tone: current.netProfit >= previous.netProfit ? 'good' : 'warning',
      text: `Net profit is ${profitChange} (${formatPeso(previous.netProfit)} → ${formatPeso(current.netProfit)}).`,
    });
  }

  if (current.expenseTotal > current.realizedProfit && current.expenseTotal > 0) {
    insights.push({
      tone: 'warning',
      text: `Expenses (${formatPeso(current.expenseTotal)}) are more than the profit from sales (${formatPeso(current.realizedProfit)}).`,
    });
  }

  const sold = rankByProfit(report.materials);
  const byMargin = sold
    .map((material) => ({ material, margin: marginPercent(material.profit, material.salesTotal) ?? 0 }))
    .sort((a, b) => b.margin - a.margin);
  const best = byMargin.at(0);
  const worst = byMargin.at(-1);

  if (best) {
    insights.push({
      tone: 'good',
      text: `${best.material.name} has the best margin: ${formatPercent(best.margin)} (${formatPeso(best.material.profit)} profit on ${formatPeso(best.material.salesTotal)} sales).`,
    });
  }

  if (worst && best && worst.material.materialId !== best.material.materialId) {
    insights.push({
      tone: worst.margin < 0 ? 'warning' : 'info',
      text: `${worst.material.name} has the lowest margin: ${formatPercent(worst.margin)}.`,
    });
  }

  if (report.linesBelowCost > 0) {
    insights.push({
      tone: 'warning',
      text: `${report.linesBelowCost} sale line${report.linesBelowCost === 1 ? ' was' : 's were'} sold below the buy price.`,
    });
  }

  const mostBought = [...report.materials].sort((a, b) => b.purchaseTotal - a.purchaseTotal).at(0);
  if (mostBought && mostBought.purchaseTotal > 0) {
    insights.push({
      tone: 'info',
      text: `Most money went to buying ${mostBought.name}: ${formatPeso(mostBought.purchaseTotal)} for ${formatQuantity(mostBought.quantityBought)} ${mostBought.unit}.`,
    });
  }

  const biggestExpense = report.expensesByCategory.at(0);
  if (biggestExpense && current.expenseTotal > 0) {
    const share = (biggestExpense.total / current.expenseTotal) * PERCENT_SCALE;
    insights.push({
      tone: 'info',
      text: `${EXPENSE_CATEGORY_LABELS[biggestExpense.category]} is the biggest expense: ${formatPeso(biggestExpense.total)} (${formatPercent(share)} of expenses).`,
    });
  }

  const topBuyer = report.topBuyers.find(isNamedPerson);
  if (topBuyer) {
    insights.push({
      tone: 'info',
      text: `${topBuyer.name} bought the most from you: ${formatPeso(topBuyer.total)} across ${topBuyer.ticketCount} ticket${topBuyer.ticketCount === 1 ? '' : 's'}.`,
    });
  }

  const topSeller = report.topSellers.find(isNamedPerson);
  if (topSeller) {
    insights.push({
      tone: 'info',
      text: `${topSeller.name} brought in the most scrap: ${formatPeso(topSeller.total)} across ${topSeller.ticketCount} ticket${topSeller.ticketCount === 1 ? '' : 's'}.`,
    });
  }

  const unsettled = current.unsettledSales + current.unsettledPurchases;
  if (unsettled > 0) {
    insights.push({
      tone: 'warning',
      text: `${unsettled} ticket${unsettled === 1 ? ' is' : 's are'} not fully paid yet.`,
    });
  }

  return insights;
}
