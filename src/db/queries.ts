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

export const insertCategory = async (category: Category, syncStatus: number = 0) => {
  const db = getDb();
  const name = (category.name || '').replace(/'/g, "''");
  const icon = (category.icon || '').replace(/'/g, "''");
  const appIcon = (category.app_icon || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO categories (id, name, type, icon, app_icon, user_id, sync_status) 
     VALUES ('${category.id}', '${name}', '${category.type}', '${icon}', '${appIcon}', '${category.user_id}', ${syncStatus})`
  );
};

export const insertPayee = async (payee: Payee, syncStatus: number = 0) => {
  const db = getDb();
  const name = (payee.name || '').replace(/'/g, "''");
  const logo = (payee.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO payees (id, name, logo, user_id, sync_status) 
     VALUES ('${payee.id}', '${name}', '${logo}', '${payee.user_id}', ${syncStatus})`
  );
};

export const insertGoal = async (goal: Goal, syncStatus: number = 0) => {
  const db = getDb();
  const name = (goal.name || '').replace(/'/g, "''");
  const logo = (goal.logo || '').replace(/'/g, "''");
  await db.execAsync(
    `INSERT OR REPLACE INTO goals (id, name, logo, goal_amount, current_amount, user_id, sync_status) 
     VALUES ('${goal.id}', '${name}', '${logo}', ${goal.goal_amount}, ${goal.current_amount}, '${goal.user_id}', ${syncStatus})`
  );
};

export const deleteGoalAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.execAsync(`DELETE FROM goals WHERE id = '${id}' AND user_id = '${userId}'`);
};

export const getTransactionsByDateRange = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND deleted = 0 ORDER BY transaction_timestamp DESC`,
    [userId, startDate, endDate]
  );
};

export const getTransactionsSummaryByDate = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ date: string; amount: number; type: string }>(
    `SELECT date, SUM(amount) as amount, type FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND deleted = 0 GROUP BY date, type ORDER BY date DESC`,
    [userId, startDate, endDate]
  );
};

export const getIncomeExpenseSummary = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ type: string; totalAmount: number }>(
    `SELECT type, SUM(amount) as totalAmount FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND deleted = 0 GROUP BY type`,
    [userId, startDate, endDate]
  );
};

export const getUnsyncedTransactions = async (userId: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(`SELECT * FROM transactions WHERE user_id = ? AND sync_status = 1 AND deleted = 0`, [userId]);
};

export const updateTransactionSyncStatus = async (id: string, status: number) => {
  const db = getDb();
  await db.execAsync(`UPDATE transactions SET sync_status = ${status} WHERE id = '${id}'`);
};

export const insertOrUpdateTransaction = async (tx: Transaction, syncStatus: number = 0) => {
  const db = getDb();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions (
      id, amount, description, transaction_timestamp, date, 
      category_id, category_name, category_icon, category_app_icon, 
      payee_id, payee_name, payee_logo, type, user_id, 
      product_link, sync_status, created_at, updated_at, deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id, 
      tx.amount, 
      tx.description || '', 
      tx.transaction_timestamp, 
      tx.date, 
      tx.category_id, 
      tx.category_name || '', 
      tx.category_icon || '', 
      tx.category_app_icon || null, 
      tx.payee_id || null, 
      tx.payee_name || null, 
      tx.payee_logo || null, 
      tx.type, 
      tx.user_id, 
      tx.product_link || null, 
      syncStatus, 
      tx.created_at || new Date().toISOString(), 
      tx.updated_at || new Date().toISOString(),
      0
    ]
  );
};

export const deleteTransactionAsync = async (id: string, userId: string) => {
  const db = getDb();
  await db.runAsync(
    `UPDATE transactions SET deleted = 1, sync_status = 1 WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
};

// Advanced Dashboard Queries
export const getNetWorth = async (userId: string) => {
  const db = getDb();
  const row = await db.getFirstAsync<{ amount: number }>(
    `SELECT SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END) as amount FROM transactions WHERE user_id = ? AND deleted = 0`,
    [userId]
  );
  return row?.amount || 0;
};

export const getSpentToday = async (userId: string, todayDate: string) => {
  const db = getDb();
  const row = await db.getFirstAsync<{ amount: number }>(
    `SELECT SUM(amount) as amount FROM transactions WHERE user_id = ? AND type = 'Expense' AND date = ? AND deleted = 0`,
    [userId, todayDate]
  );
  return row?.amount || 0;
};

export const getTransactionsByDate = async (userId: string, date: string) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE user_id = ? AND date = ? AND deleted = 0 ORDER BY transaction_timestamp DESC`,
    [userId, date]
  );
};
export const getTransactionsByCategoryForExpense = async (userId: string, startDate: string, endDate: string) => {
  const db = getDb();
  return db.getAllAsync<{ category_name: string; totalAmount: number }>(
    `SELECT category_name, SUM(amount) as totalAmount FROM transactions 
     WHERE user_id = ? AND type = 'Expense' AND date >= ? AND date <= ? AND deleted = 0 
     GROUP BY category_name ORDER BY totalAmount DESC`,
    [userId, startDate, endDate]
  );
};
