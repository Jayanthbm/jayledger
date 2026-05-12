import { getDb } from './database';
import { Category, Payee, Goal } from '../models/types';

/**
 * Meta Entity CRUD (Categories, Payees, Goals).
 */

export const getCategories = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Category>(
    `SELECT * FROM categories WHERE user_id = ? ORDER BY priority ASC, name ASC`,
    [userId],
  );
};

export const getPayees = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Payee>(
    `SELECT * FROM payees WHERE user_id = ? ORDER BY priority ASC, name ASC`,
    [userId],
  );
};

export const insertCategory = async (category: Category, syncStatus: number = 1) => {
  const db = getDb();
  const name = (category.name || '').replace(/'/g, "''");
  const icon = (category.icon || '').replace(/'/g, "''");
  const appIcon = (category.app_icon || '').replace(/'/g, "''");

  let priority = category.priority ?? 0;
  if (priority === 0) {
    const result = await db.getFirstAsync<{ maxP: number }>(
      `SELECT MAX(priority) as maxP FROM categories WHERE user_id = ?`,
      [category.user_id],
    );
    priority = (result?.maxP || 0) + 1;
  }

  await db.execAsync(
    `INSERT OR REPLACE INTO categories (id, name, type, icon, app_icon, user_id, is_living_cost, priority, sync_status)
     VALUES ('${category.id}', '${name}', '${category.type}', '${icon}', '${appIcon}', '${category.user_id}', ${category.is_living_cost || 0}, ${priority}, ${syncStatus})`,
  );
};

export const insertPayee = async (payee: Payee, syncStatus: number = 1) => {
  const db = getDb();
  const name = (payee.name || '').replace(/'/g, "''");
  const logo = (payee.logo || '').replace(/'/g, "''");

  let priority = payee.priority ?? 0;
  if (priority === 0) {
    const result = await db.getFirstAsync<{ maxP: number }>(
      `SELECT MAX(priority) as maxP FROM payees WHERE user_id = ?`,
      [payee.user_id],
    );
    priority = (result?.maxP || 0) + 1;
  }

  await db.execAsync(
    `INSERT OR REPLACE INTO payees (id, name, logo, user_id, priority, sync_status)
     VALUES ('${payee.id}', '${name}', '${logo}', '${payee.user_id}', ${priority}, ${syncStatus})`,
  );
};

export const insertGoal = async (goal: Goal, syncStatus: number = 1) => {
  const db = getDb();
  const name = (goal.name || '').replace(/'/g, "''");
  const logo = (goal.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status, deleted)
     VALUES ('${goal.id}', '${name}', '${logo}', ${goal.goal_amount}, ${goal.current_amount}, '${goal.user_id}', ${syncStatus}, 0)`,
  );
};

export const deleteGoalAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(
    `UPDATE goals SET deleted = 1, sync_status = 1 WHERE id = '${id}' AND user_id = '${userId}'`,
  );
};

export const toggleCategoryLivingCost = async (categoryId: string, isLivingCost: boolean) => {
  const db = getDb();
  await db.execAsync(
    `UPDATE categories SET is_living_cost = ${isLivingCost ? 1 : 0} WHERE id = '${categoryId}'`,
  );
};

export const updateCategoryPriorities = async (
  updates: { id: string; priority: number }[],
  userId: string,
) => {
  const db = getDb();
  // Execute updates sequentially without explicit transaction
  // Each UPDATE is atomic, and we're just updating priority fields
  for (const update of updates) {
    await db.runAsync(
      `UPDATE categories SET priority = ?, sync_status = 1 WHERE id = ? AND user_id = ?`,
      [update.priority, update.id, userId],
    );
  }
};

export const updatePayeePriorities = async (
  updates: { id: string; priority: number }[],
  userId: string,
) => {
  const db = getDb();
  // Execute updates sequentially without explicit transaction
  // Each UPDATE is atomic, and we're just updating priority fields
  for (const update of updates) {
    await db.runAsync(
      `UPDATE payees SET priority = ?, sync_status = 1 WHERE id = ? AND user_id = ?`,
      [update.priority, update.id, userId],
    );
  }
};
