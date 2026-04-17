import { getDb } from '../db/database';
import { Transaction } from '../models/types';
import { getCategories, getPayees, getMonthlyFilteredStats } from '../db/queries';

export interface TransactionHeaderInfo {
  date: string;
  total: number;
  transactions: Transaction[];
}

export type FlashListItem =
  | (Transaction & { itemType: 'transaction' })
  | (TransactionHeaderInfo & { itemType: 'header' });

export interface TransactionFetchParams {
  userId: string;
  search?: string;
  selectedCats?: string[];
  selectedPayees?: string[];
  startDate?: string | null;
  endDate?: string | null;
}

export const fetchTransactions = async ({
  userId,
  search = '',
  selectedCats = [],
  selectedPayees = [],
  startDate = null,
  endDate = null,
}: TransactionFetchParams): Promise<{
  listData: FlashListItem[];
  stickyHeaderIndices: number[];
  totalFiltered: number;
}> => {
  const db = getDb();

  let query = `SELECT * FROM transactions WHERE user_id = '${userId}' AND deleted = 0`;

  // Search logic
  if (search.trim()) {
    const s = search.trim().replace(/'/g, "''");
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      query += ` AND amount = ${s}`;
    } else {
      query += ` AND (description LIKE '%${s}%' OR CAST(amount AS TEXT) LIKE '%${s}%')`;
    }
  }

  // Filter logic
  if (selectedCats.length > 0) {
    const catIdsString = selectedCats.map((id) => `'${id}'`).join(',');
    query += ` AND category_id IN (${catIdsString})`;
  }

  if (selectedPayees.length > 0) {
    const payeeIdsString = selectedPayees.map((id) => `'${id}'`).join(',');
    query += ` AND payee_id IN (${payeeIdsString})`;
  }

  if (startDate) {
    query += ` AND date >= '${startDate}'`;
  }
  if (endDate) {
    query += ` AND date <= '${endDate}'`;
  }

  query += ` ORDER BY date DESC, transaction_timestamp DESC`;

  const rows = await db.getAllAsync<Transaction>(query);

  const grouped = rows.reduce(
    (acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = { date: tx.date, total: 0, transactions: [] };
      acc[tx.date].transactions.push(tx);
      acc[tx.date].total += tx.type === 'Income' ? tx.amount : -tx.amount;
      return acc;
    },
    {} as Record<string, TransactionHeaderInfo>,
  );

  const flattened: FlashListItem[] = [];
  const stickyIndices: number[] = [];
  let currentTotal = 0;

  Object.values(grouped).forEach((group) => {
    stickyIndices.push(flattened.length);
    flattened.push({ itemType: 'header', ...group });
    group.transactions.forEach((tx) => {
      flattened.push({ itemType: 'transaction', ...tx });
      currentTotal += tx.type === 'Income' ? tx.amount : -tx.amount;
    });
  });

  return {
    listData: flattened,
    stickyHeaderIndices: stickyIndices,
    totalFiltered: currentTotal,
  };
};

export const fetchTransactionFilterData = async (userId: string) => {
  const [cats, p] = await Promise.all([getCategories(userId), getPayees(userId)]);
  return { categories: cats, payees: p };
};

export const fetchStatsBreakdown = async (
  userId: string,
  selectedCats: string[],
  selectedPayees: string[],
  search: string,
) => {
  return await getMonthlyFilteredStats(userId, selectedCats, selectedPayees, search);
};

export const formatIconName = (name: string) => {
  if (!name) return 'category';
  let formatted = name.trim();
  if (formatted.startsWith('Md')) {
    formatted = formatted.substring(2);
    formatted = formatted.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  return formatted;
};
