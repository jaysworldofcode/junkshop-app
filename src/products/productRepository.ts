import type { SQLiteDatabase } from 'expo-sqlite';

import { SQLITE_ACTIVE, SQLITE_INACTIVE } from '@/constants/database';
import {
  isSameActiveProduct,
  optionalText,
  toLikeSearch,
  type Product,
  type ProductWithUsage,
} from '@/domain/product';

type MaterialRow = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  unit: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function listProducts(database: SQLiteDatabase, search: string): Promise<Product[]> {
  const likeSearch = toLikeSearch(search);

  if (likeSearch.length === 0) {
    return database
      .getAllAsync<MaterialRow>(
        `SELECT id, name, code, category, unit, is_active, created_at, updated_at
         FROM materials
         ORDER BY is_active DESC, name COLLATE NOCASE ASC`
      )
      .then((rows) => rows.map(mapRow));
  }

  const pattern = `%${likeSearch}%`;
  return database
    .getAllAsync<MaterialRow>(
      `SELECT id, name, code, category, unit, is_active, created_at, updated_at
       FROM materials
       WHERE name LIKE ? COLLATE NOCASE
          OR IFNULL(code, '') LIKE ? COLLATE NOCASE
          OR IFNULL(category, '') LIKE ? COLLATE NOCASE
       ORDER BY is_active DESC, name COLLATE NOCASE ASC`,
      [pattern, pattern, pattern]
    )
    .then((rows) => rows.map(mapRow));
}

/** Active products, most often bought first, so the counter reaches common materials fastest. */
export function listActiveProductsByUsage(database: SQLiteDatabase): Promise<ProductWithUsage[]> {
  return database
    .getAllAsync<MaterialRow & { purchase_count: number }>(
      `SELECT m.id, m.name, m.code, m.category, m.unit, m.is_active, m.created_at, m.updated_at,
              COUNT(pi.id) AS purchase_count
       FROM materials m
       LEFT JOIN purchase_items pi ON pi.material_id = m.id
       WHERE m.is_active = ?
       GROUP BY m.id
       ORDER BY purchase_count DESC, m.name COLLATE NOCASE ASC`,
      [SQLITE_ACTIVE]
    )
    .then((rows) => rows.map((row) => ({ ...mapRow(row), purchaseCount: row.purchase_count })));
}

export async function getProduct(database: SQLiteDatabase, id: string): Promise<Product | null> {
  const row = await database.getFirstAsync<MaterialRow>(
    `SELECT id, name, code, category, unit, is_active, created_at, updated_at
     FROM materials
     WHERE id = ?`,
    [id]
  );

  return row ? mapRow(row) : null;
}

export async function findActiveDuplicate(
  database: SQLiteDatabase,
  candidate: { name: string; unit: string },
  excludeId?: string
): Promise<Product | null> {
  const rows = await database.getAllAsync<MaterialRow>(
    `SELECT id, name, code, category, unit, is_active, created_at, updated_at
     FROM materials
     WHERE is_active = ?`,
    [SQLITE_ACTIVE]
  );

  const duplicate = rows
    .map(mapRow)
    .find((product) => product.id !== excludeId && isSameActiveProduct(candidate, product));

  return duplicate ?? null;
}

export async function insertProduct(database: SQLiteDatabase, product: Product): Promise<void> {
  await database.runAsync(
    `INSERT INTO materials (id, name, code, category, unit, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.name.trim(),
      optionalText(product.code ?? ''),
      optionalText(product.category ?? ''),
      product.unit.trim(),
      product.isActive ? SQLITE_ACTIVE : SQLITE_INACTIVE,
      product.createdAt,
      product.updatedAt,
    ]
  );
}

export async function updateProduct(database: SQLiteDatabase, product: Product): Promise<void> {
  await database.runAsync(
    `UPDATE materials
     SET name = ?, code = ?, category = ?, unit = ?, is_active = ?, updated_at = ?
     WHERE id = ?`,
    [
      product.name.trim(),
      optionalText(product.code ?? ''),
      optionalText(product.category ?? ''),
      product.unit.trim(),
      product.isActive ? SQLITE_ACTIVE : SQLITE_INACTIVE,
      product.updatedAt,
      product.id,
    ]
  );
}

function mapRow(row: MaterialRow): Product {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    unit: row.unit,
    isActive: row.is_active === SQLITE_ACTIVE,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
