import { getTransactionsByDate, getMinTransactionDate } from '../db/queries';
import { Transaction } from '../models/types';
import { format, getDaysInMonth } from 'date-fns';

export const fetchMinDate = async (userId: string): Promise<Date> => {
  const d = await getMinTransactionDate(userId);
  return d ? new Date(d) : new Date();
};

export const fetchTransactionsForDate = async (
  userId: string,
  date: Date,
): Promise<Transaction[]> => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return await getTransactionsByDate(userId, dateStr);
};

export const calculateDailyNetTotal = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, tx) => sum + (tx.type === 'Income' ? tx.amount : -tx.amount), 0);
};

export const getNewDateForPeriod = (year: number, month: number, currentDay: number): Date => {
  const daysInNewMonth = getDaysInMonth(new Date(year, month));
  const newDay = currentDay > daysInNewMonth ? 1 : currentDay;
  return new Date(year, month, newDay);
};
