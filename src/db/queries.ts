import { getDb } from './database';
import { Transaction, Category, Payee, Goal } from '../models/types';

export const getCategories = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Category>(`SELECT * FROM categories WHERE user_id = '${userId}' ORDER BY type, name`);
};

export const getPayees = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Payee>(`SELECT * FROM payees WHERE user_id = '${userId}' ORDER BY name`);
};

export const insertCategory = async (category: Category) => {
  const db = getDb();
  const name = (category.name || '').replace(/'/g, "''");
  const icon = (category.icon || '').replace(/'/g, "''");
  const appIcon = (category.app_icon || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO categories (id, name, type, icon, app_icon, user_id) 
     VALUES ('${category.id}', '${name}', '${category.type}', '${icon}', '${appIcon}', '${category.user_id}')`
  );
};

export const insertPayee = async (payee: Payee) => {
  const db = getDb();
  const name = (payee.name || '').replace(/'/g, "''");
  const logo = (payee.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO payees (id, name, logo, user_id) 
     VALUES ('${payee.id}', '${name}', '${logo}', '${payee.user_id}')`
  );
};

export const insertGoal = async (goal: Goal) => {
  const db = getDb();
  const name = (goal.name || '').replace(/'/g, "''");
  const logo = (goal.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id) 
     VALUES ('${goal.id}', '${name}', '${logo}', ${goal.goal_amount}, ${goal.current_amount}, '${goal.user_id}')`
  );
};

export const deleteGoalAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(`DELETE FROM goals WHERE id = '${id}' AND user_id = '${userId}'`);
};

export const getTransactionsByDateRange = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = '${userId}' AND date >= '${startDate}' AND date <= '${endDate}' ORDER BY transaction_timestamp DESC`
  );
};

export const getTransactionsSummaryByDate = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ date: string; amount: number; type: string }>(
    `SELECT date, SUM(amount) as amount, type FROM transactions WHERE user_id = '${userId}' AND date >= '${startDate}' AND date <= '${endDate}' GROUP BY date, type ORDER BY date DESC`
  );
};

export const getIncomeExpenseSummary = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ type: string; totalAmount: number }>(
    `SELECT type, SUM(amount) as totalAmount FROM transactions WHERE user_id = '${userId}' AND date >= '${startDate}' AND date <= '${endDate}' GROUP BY type`
  );
};

export const getTransactionsByCategoryForExpense = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ category_name: string; totalAmount: number; category_icon: string }>(
    `SELECT category_name, category_icon, SUM(amount) as totalAmount FROM transactions WHERE user_id = '${userId}' AND type = "Expense" AND date >= '${startDate}' AND date <= '${endDate}' GROUP BY category_name ORDER BY totalAmount DESC`
  );
};

export const insertOrUpdateTransaction = async (tx: Transaction) => {
  const db = getDb();
  const desc = (tx.description || '').replace(/'/g, "''");
  const catName = (tx.category_name || '').replace(/'/g, "''");
  const catIcon = (tx.category_icon || '').replace(/'/g, "''");
  const catAppIcon = (tx.category_app_icon || '').replace(/'/g, "''");
  const payeeName = (tx.payee_name || '').replace(/'/g, "''");
  const payeeLogo = (tx.payee_logo || '').replace(/'/g, "''");
  
  await db.execAsync(
    `INSERT OR REPLACE INTO transactions (id, amount, description, transaction_timestamp, date, category_id, category_name, category_icon, category_app_icon, payee_id, payee_name, payee_logo, type, user_id) 
     VALUES ('${tx.id}', ${tx.amount}, '${desc}', '${tx.transaction_timestamp}', '${tx.date}', '${tx.category_id}', '${catName}', '${catIcon}', '${catAppIcon}', '${tx.payee_id}', '${payeeName}', '${payeeLogo}', '${tx.type}', '${tx.user_id}')`
  );
};

export const deleteTransactionAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(`DELETE FROM transactions WHERE id = '${id}' AND user_id = '${userId}'`);
};
