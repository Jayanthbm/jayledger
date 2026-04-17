import { getBudgets, getBudgetSpending, getTransactionsByDateRange } from '../db/queries';
import { Budget, Transaction } from '../models/types';
import { syncBudgets } from './syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EnrichedBudget extends Budget {
  spent: number;
}

export const fetchBudgetsWithSpending = async (
  userId: string,
  startDateStr: string,
  endDateStr: string,
  sortBy: 'name' | 'amount' | 'spent' | 'remaining',
  sortAsc: boolean
): Promise<EnrichedBudget[]> => {
  const budgets = await getBudgets(userId);
  const enriched: EnrichedBudget[] = await Promise.all(
    budgets.map(async (b) => {
      let categoryIds: string[] = [];
      try {
        categoryIds = JSON.parse(b.categories);
      } catch (e) {
        console.error("Error parsing budget categories:", e);
      }
      const spent = await getBudgetSpending(userId, categoryIds, startDateStr, endDateStr);
      return { ...b, spent };
    })
  );

  return [...enriched].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'amount') cmp = a.amount - b.amount;
    else if (sortBy === 'spent') cmp = a.spent - b.spent;
    else if (sortBy === 'remaining') cmp = (a.amount - a.spent) - (b.amount - b.spent);
    
    return sortAsc ? cmp : -cmp;
  });
};

export const fetchBudgetDrillDown = async (
  userId: string,
  categoriesJson: string,
  startDateStr: string,
  endDateStr: string
): Promise<Transaction[]> => {
  let categoryIds: string[] = [];
  try {
    categoryIds = JSON.parse(categoriesJson);
  } catch (e) {
    return [];
  }

  const all = await getTransactionsByDateRange(userId, startDateStr, endDateStr);
  return all.filter(t => t.category_id && categoryIds.includes(t.category_id));
};

export const handleBudgetSync = async (userId: string) => {
  await syncBudgets(userId);
  await AsyncStorage.setItem(`@initial_budget_sync_checked_${userId}`, 'true');
};
