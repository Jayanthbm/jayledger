import { getDb } from '../db/database';
import { Transaction } from '../models/types';
import {
  getCategories,
  getPayees,
  getMonthlyFilteredStats,
  getTransactionGroups,
} from '../db/queries';

import { mapTransactionsToFlashList, FlashListItem } from '../utils/dataMappers';

export interface TransactionFetchParams {
  userId: string;
  search?: string;
  selectedCats?: string[];
  selectedPayees?: string[];
  selectedGroups?: string[];
  startDate?: string | null;
  endDate?: string | null;
}

export const fetchTransactions = async ({
  userId,
  search = '',
  selectedCats = [],
  selectedPayees = [],
  selectedGroups = [],
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

  if (selectedGroups.length > 0) {
    const groupIdsString = selectedGroups.map((id) => `'${id}'`).join(',');
    query += ` AND group_id IN (${groupIdsString})`;
  }

  if (startDate) {
    query += ` AND date >= '${startDate}'`;
  }
  if (endDate) {
    query += ` AND date <= '${endDate}'`;
  }

  query += ` ORDER BY date DESC, transaction_timestamp DESC`;

  const rows = await db.getAllAsync<Transaction>(query);
  return mapTransactionsToFlashList(rows);
};

export const fetchTransactionFilterData = async (userId: string) => {
  const [cats, p, g] = await Promise.all([
    getCategories(userId),
    getPayees(userId),
    getTransactionGroups(userId),
  ]);
  return { categories: cats, payees: p, groups: g };
};

export const fetchStatsBreakdown = async (
  userId: string,
  selectedCats: string[],
  selectedPayees: string[],
  selectedGroups: string[],
  search: string,
) => {
  return await getMonthlyFilteredStats(
    userId,
    selectedCats,
    selectedPayees,
    selectedGroups,
    search,
  );
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
