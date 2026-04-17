import { getDb } from './database';
import { Category, Payee, Goal } from '../models/types';

/**
 * Meta Entity CRUD (Categories, Payees, Goals).
 */

export const getCategories = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Category>(
    `SELECT * FROM categories WHERE user_id = '${userId}' ORDER BY type, name`,
  );
};

export const getPayees = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Payee>(`SELECT * FROM payees WHERE user_id = '${userId}' ORDER BY name`);
};

export const insertCategory = async (category: Category, syncStatus: number = 0) => {
  const db = getDb();
  const name = (category.name || '').replace(/'/g, "''");
  const icon = (category.icon || '').replace(/'/g, "''");
  const appIcon = (category.app_icon || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO categories (id, name, type, icon, app_icon, user_id, is_living_cost, sync_status)
     VALUES ('${category.id}', '${name}', '${category.type}', '${icon}', '${appIcon}', '${category.user_id}', ${category.is_living_cost || 0}, ${syncStatus})`,
  );
};

export const insertPayee = async (payee: Payee, syncStatus: number = 0) => {
  const db = getDb();
  const name = (payee.name || '').replace(/'/g, "''");
  const logo = (payee.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO payees (id, name, logo, user_id, sync_status)
     VALUES ('${payee.id}', '${name}', '${logo}', '${payee.user_id}', ${syncStatus})`,
  );
};

export const insertGoal = async (goal: Goal, syncStatus: number = 0) => {
  const db = getDb();
  const name = (goal.name || '').replace(/'/g, "''");
  const logo = (goal.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status)
     VALUES ('${goal.id}', '${name}', '${logo}', ${goal.goal_amount}, ${goal.current_amount}, '${goal.user_id}', ${syncStatus})`,
  );
};

export const deleteGoalAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(`DELETE FROM goals WHERE id = '${id}' AND user_id = '${userId}'`);
};

export const toggleCategoryLivingCost = async (categoryId: string, isLivingCost: boolean) => {
  const db = getDb();
  await db.execAsync(
    `UPDATE categories SET is_living_cost = ${isLivingCost ? 1 : 0} WHERE id = '${categoryId}'`,
  );
};
