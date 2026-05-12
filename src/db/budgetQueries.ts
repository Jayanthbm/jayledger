import { getDb } from './database';
import { Budget } from '../models/types';
import { generateUUID } from '../utils/commonUtils';
import { logger } from '../utils/logger';

/**
 * Budget CRUD and Spending Logic.
 */

export const getBudgets = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Budget>(
    `SELECT * FROM budgets WHERE user_id = '${userId}' AND deleted = 0 ORDER BY name`,
  );
};

export const addBudget = async (budget: Omit<Budget, 'id'>) => {
  const db = getDb();
  const id = generateUUID();
  logger.info(`[DB:Budget] adding: ${budget.name}`);
  await db.execAsync(
    `INSERT INTO budgets (id, user_id, name, amount, categories, interval, logo, start_date, deleted, sync_status)
         VALUES ('${id}', '${budget.user_id}', '${budget.name.replace(/'/g, "''")}', ${budget.amount}, '${budget.categories}', '${budget.interval}', '${budget.logo}', '${budget.start_date}', 0, 1)`,
  );
  return id;
};

export const updateBudget = async (id: string, budget: Partial<Budget>) => {
  const db = getDb();
  logger.info(`[DB:Budget] updating: ${id}`);
  let query = `UPDATE budgets SET sync_status = 1`;
  if (budget.name) query += `, name = '${budget.name.replace(/'/g, "''")}'`;
  if (budget.amount !== undefined) query += `, amount = ${budget.amount}`;
  if (budget.categories) query += `, categories = '${budget.categories}'`;
  if (budget.interval) query += `, interval = '${budget.interval}'`;
  if (budget.logo) query += `, logo = '${budget.logo}'`;
  if (budget.start_date) query += `, start_date = '${budget.start_date}'`;
  query += ` WHERE id = '${id}'`;
  await db.execAsync(query);
};

export const deleteBudget = async (id: string) => {
  const db = getDb();
  await db.execAsync(`UPDATE budgets SET deleted = 1, sync_status = 1 WHERE id = '${id}'`);
};

export const getBudgetSpending = async (
  userId: string,
  categoryIds: string[],
  startDate: string,
  endDate: string,
) => {
  if (categoryIds.length === 0) return 0;
  const db = getDb();
  const placeholders = categoryIds.map(() => '?').join(',');
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT SUM(amount) as total FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = 'Expense'
     AND date >= ? AND date <= ?
     AND category_id IN (${placeholders})`,
    [userId, startDate, endDate, ...categoryIds],
  );
  return row?.total || 0;
};
