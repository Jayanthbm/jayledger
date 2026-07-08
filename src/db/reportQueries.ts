import { getDb } from './database';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { Transaction } from '../models/types';

/**
 * Complex Aggregation Queries for Reports.
 */

export const getIncomeExpenseSummary = async (
  userId: string,
  startDate: string,
  endDate: string,
) => {
  const db = getDb();
  return db.getAllAsync<{ type: string; totalAmount: number }>(
    `SELECT type, SUM(amount) as totalAmount FROM transactions WHERE user_id = ? AND date >= ? AND date <= ? AND deleted = 0 GROUP BY type`,
    [userId, startDate, endDate],
  );
};

export const getTransactionsByCategoryForExpense = async (
  userId: string,
  startDate: string,
  endDate: string,
) => {
  const db = getDb();
  return db.getAllAsync<{ category_name: string; totalAmount: number }>(
    `SELECT category_name, SUM(amount) as totalAmount FROM transactions
     WHERE user_id = ? AND type = 'Expense' AND date >= ? AND date <= ? AND deleted = 0
     GROUP BY category_name ORDER BY totalAmount DESC`,
    [userId, startDate, endDate],
  );
};

export const getReportMonthlyLivingCosts = async (userId: string, month: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_app_icon: string;
    amount: number;
  }>(
    `SELECT category_id, category_name, category_app_icon, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = 'Expense'
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
       AND category_id IN (SELECT id FROM categories WHERE is_living_cost = 1 AND user_id = ?)
     GROUP BY category_name
     ORDER BY amount DESC`,
    [userId, month, year, userId],
  );
};

export const getReportSubscriptionBills = async (userId: string, month: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{ category_name: string; amount: number }>(
    `SELECT category_name, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = 'Expense'
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
       AND category_name IN ('Subscription', 'Bills')
     GROUP BY category_name`,
    [userId, month, year],
  );
};

export const getReportSummaryByCategory = async (
  userId: string,
  type: string,
  month: string,
  year: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_app_icon: string;
    amount: number;
  }>(
    `SELECT category_id, category_name, category_app_icon, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
     GROUP BY category_name
     ORDER BY amount DESC`,
    [userId, type, month, year],
  );
};

export const getReportYearlySummaryByCategory = async (
  userId: string,
  type: string,
  year: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_app_icon: string;
    amount: number;
  }>(
    `SELECT category_id, category_name, category_app_icon, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%Y', date) = ?
     GROUP BY category_name
     ORDER BY amount DESC`,
    [userId, type, year],
  );
};

export const getReportSummaryByPayee = async (
  userId: string,
  type: string,
  month: string,
  year: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    payee_id: string;
    payee_name: string;
    payee_logo: string;
    amount: number;
  }>(
    `SELECT payee_id, payee_name, payee_logo, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
       AND payee_id IS NOT NULL AND payee_id !='null'
     GROUP BY payee_name
     ORDER BY amount DESC`,
    [userId, type, month, year],
  );
};

export const getReportYearlySummaryByPayee = async (userId: string, type: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{
    payee_id: string;
    payee_name: string;
    payee_logo: string;
    amount: number;
  }>(
    `SELECT payee_id, payee_name, payee_logo, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%Y', date) = ?
       AND payee_id IS NOT NULL AND payee_id !='null'
     GROUP BY payee_name
     ORDER BY amount DESC`,
    [userId, type, year],
  );
};

export const getReportMonthlySummary = async (userId: string, month: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{ type: string; totalAmount: number }>(
    `SELECT type, SUM(amount) as totalAmount
     FROM transactions
     WHERE user_id = ? AND deleted = 0
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
     GROUP BY type`,
    [userId, month, year],
  );
};

export const getReportYearlySummary = async (userId: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{ type: string; totalAmount: number }>(
    `SELECT type, SUM(amount) as totalAmount
     FROM transactions
     WHERE user_id = ? AND deleted = 0
       AND strftime('%Y', date) = ?
     GROUP BY type`,
    [userId, year],
  );
};

export const getReportPayeesOverview = async (userId: string, type: string) => {
  const db = getDb();
  return db.getAllAsync<{
    payee_id: string;
    payee_name: string;
    payee_logo: string;
    amount: number;
  }>(
    `SELECT payee_id, payee_name, payee_logo, SUM(amount) as amount FROM transactions 
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND payee_id IS NOT NULL AND payee_id !='null'
     GROUP BY payee_name 
     ORDER BY amount DESC`,
    [userId, type],
  );
};

export const getReportCategoriesOverview = async (userId: string, type: string) => {
  const db = getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_app_icon: string;
    amount: number;
  }>(
    `SELECT category_id, category_name, category_app_icon, SUM(amount) as amount FROM transactions 
     WHERE user_id = ? AND deleted = 0 AND type = ?
     GROUP BY category_name 
     ORDER BY amount DESC`,
    [userId, type],
  );
};

export const getMonthlyFilteredStats = async (
  userId: string,
  categoryIds: string[],
  payeeIds: string[],
  groupIds: string[],
  search: string,
) => {
  const db = getDb();
  const stats: { month: string; income: number; expense: number }[] = [];

  for (let i = 0; i < 5; i++) {
    const d = subMonths(new Date(), i);
    const start = format(startOfMonth(d), 'yyyy-MM-dd');
    const end = format(endOfMonth(d), 'yyyy-MM-dd');

    let query = `SELECT type, SUM(amount) as total FROM transactions WHERE user_id = ? AND deleted = 0 AND date >= ? AND date <= ?`;
    const params: (string | number)[] = [userId, start, end];

    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      query += ` AND category_id IN (${placeholders})`;
      params.push(...categoryIds);
    }
    if (payeeIds.length > 0) {
      const placeholders = payeeIds.map(() => '?').join(',');
      query += ` AND payee_id IN (${placeholders})`;
      params.push(...payeeIds);
    }
    if (groupIds.length > 0) {
      const placeholders = groupIds.map(() => '?').join(',');
      query += ` AND group_id IN (${placeholders})`;
      params.push(...groupIds);
    }
    if (search.trim()) {
      const s = search.trim();
      query += ` AND (description LIKE ? OR CAST(amount AS TEXT) LIKE ?)`;
      params.push(`%${s}%`, `%${s}%`);
    }

    query += ` GROUP BY type`;

    const rows = await db.getAllAsync<{ type: string; total: number }>(query, params);
    let inc = 0,
      exp = 0;
    rows.forEach((r) => {
      if (r.type === 'Income') inc = r.total;
      else exp = r.total;
    });
    stats.push({ month: format(d, 'MMM yyyy'), income: inc, expense: exp });
  }
  return stats;
};

export const getAggregatedDataForPeriod = async (
  userId: string,
  type: 'Expense' | 'Income',
  startDate: string,
  endDate: string,
  groupBy: 'category' | 'payee' | 'group',
) => {
  const db = getDb();
  const groupCol =
    groupBy === 'category' ? 'category_name' : groupBy === 'payee' ? 'payee_name' : 'group_name';
  const idCol =
    groupBy === 'category' ? 'category_id' : groupBy === 'payee' ? 'payee_id' : 'group_id';
  const iconCol =
    groupBy === 'category' ? 'category_app_icon' : groupBy === 'payee' ? 'payee_logo' : 'NULL';

  const query = `
    SELECT 
      ${idCol} as id, 
      ${groupCol} as name, 
      ${iconCol} as icon,
      SUM(amount) as amount
    FROM transactions
    WHERE user_id = ? AND type = ? AND date >= ? AND date <= ? AND deleted = 0
    AND ${idCol} IS NOT NULL AND ${idCol} != 'null' AND ${idCol} != 'undefined' AND ${idCol} != ''
    GROUP BY ${groupCol}
    ORDER BY amount DESC
  `;

  return db.getAllAsync<{ id: string; name: string; icon: string; amount: number }>(query, [
    userId,
    type,
    startDate,
    endDate,
  ]);
};

export const getReportSummaryByGroup = async (
  userId: string,
  type: string,
  month: string,
  year: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    group_id: string;
    group_name: string;
    amount: number;
  }>(
    `SELECT group_id, group_name, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
       AND group_id IS NOT NULL AND group_id != 'null' AND group_id != 'undefined' AND group_id != ''
     GROUP BY group_name
     ORDER BY amount DESC`,
    [userId, type, month, year],
  );
};

export const getReportYearlySummaryByGroup = async (userId: string, type: string, year: string) => {
  const db = getDb();
  return db.getAllAsync<{
    group_id: string;
    group_name: string;
    amount: number;
  }>(
    `SELECT group_id, group_name, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND deleted = 0 AND type = ?
       AND strftime('%Y', date) = ?
       AND group_id IS NOT NULL AND group_id != 'null' AND group_id != 'undefined' AND group_id != ''
     GROUP BY group_name
     ORDER BY amount DESC`,
    [userId, type, year],
  );
};

export const getCategoriesSummaryByGroup = async (
  userId: string,
  groupId: string,
  type: string,
) => {
  const db = getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_app_icon: string;
    amount: number;
  }>(
    `SELECT category_id, category_name, category_app_icon, SUM(amount) as amount
     FROM transactions
     WHERE user_id = ? AND group_id = ? AND deleted = 0 AND type = ?
     GROUP BY category_name
     ORDER BY amount DESC`,
    [userId, groupId, type],
  );
};

export const getTransactionsByGroupAndCategory = async (
  userId: string,
  groupId: string,
  categoryId: string,
  type: string,
) => {
  const db = getDb();
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions
     WHERE user_id = ? AND group_id = ? AND category_id = ? AND deleted = 0 AND type = ?
     ORDER BY date DESC, transaction_timestamp DESC`,
    [userId, groupId, categoryId, type],
  );
};

export const getReportGroupsOverview = async (userId: string, type: string) => {
  const db = getDb();
  return db.getAllAsync<{
    group_id: string;
    group_name: string;
    amount: number;
    priority: number;
  }>(
    `SELECT t.group_id, t.group_name, SUM(t.amount) as amount, COALESCE(g.priority, 9999) as priority
     FROM transactions t
     LEFT JOIN transaction_groups g ON t.group_id = g.id
     WHERE t.user_id = ? AND t.deleted = 0 AND t.type = ?
       AND t.group_id IS NOT NULL AND t.group_id != 'null' AND t.group_id != 'undefined' AND t.group_id != ''
     GROUP BY t.group_name 
     ORDER BY priority ASC, amount DESC`,
    [userId, type],
  );
};
