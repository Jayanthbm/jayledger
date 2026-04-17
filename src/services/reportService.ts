import {
  getReportMonthlyLivingCosts,
  getReportSubscriptionBills,
  getReportSummaryByPayee,
  getReportSummaryByCategory,
  getReportMonthlySummary,
  getReportYearlySummary,
  getReportPayeesOverview,
  getReportCategoriesOverview,
  getTransactionsByDateRange,
} from '../db/queries';
import { Transaction, ReportItem } from '../models/types';
import { format, endOfMonth } from 'date-fns';

export const fetchReportData = async (
  userId: string,
  reportType: string,
  type: 'Expense' | 'Income',
  monthStr: string,
  year: string,
): Promise<ReportItem[]> => {
  switch (reportType) {
    case 'monthlyLivingCosts':
      return await getReportMonthlyLivingCosts(userId, monthStr, year);
    case 'subscriptionAndBills':
      return await getReportSubscriptionBills(userId, monthStr, year);
    case 'summaryByPayee':
      return await getReportSummaryByPayee(userId, type, monthStr, year);
    case 'summaryByCategory':
      return await getReportSummaryByCategory(userId, type, monthStr, year);
    case 'monthlySummary':
      return await getReportMonthlySummary(userId, monthStr, year);
    case 'yearlySummary':
      return await getReportYearlySummary(userId, year);
    case 'payees':
      return await getReportPayeesOverview(userId, type);
    case 'categories':
      return await getReportCategoriesOverview(userId, type);
    default:
      return [];
  }
};

export const handleReportDrillDown = async (
  userId: string,
  reportType: string,
  item: ReportItem,
  type: 'Expense' | 'Income',
  monthStr: string,
  year: string,
): Promise<Transaction[]> => {
  const startDate = `${year}-${monthStr}-01`;
  const endDate = format(
    endOfMonth(new Date(parseInt(year), parseInt(monthStr) - 1)),
    'yyyy-MM-dd',
  );

  const isOverview = reportType === 'payees' || reportType === 'categories';
  const fetchStartDate = isOverview ? '1970-01-01' : startDate;
  const fetchEndDate = isOverview ? '2099-12-31' : endDate;

  if (['summaryByCategory', 'monthlyLivingCosts', 'categories'].includes(reportType)) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter(
      (t: Transaction) =>
        t.category_name === (item.category_name || item.name) && t.type === (item.type || type),
    );
  } else if (['summaryByPayee', 'payees'].includes(reportType)) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter(
      (t: Transaction) =>
        t.payee_name === (item.payee_name || item.name) && t.type === (item.type || type),
    );
  } else if (reportType === 'subscriptionAndBills') {
    const all = await getTransactionsByDateRange(userId, startDate, endDate);
    return all.filter((t: Transaction) => t.category_name === item.category_name);
  }

  return [];
};

export const sortReportData = (
  data: ReportItem[],
  searchQuery: string,
  sortBy: 'name' | 'amount',
  sortAsc: boolean,
): ReportItem[] => {
  let filtered = data;
  if (searchQuery.trim()) {
    filtered = filtered.filter((item) =>
      (item.name || item.category_name || item.payee_name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }

  return [...filtered].sort((a, b) => {
    let valA =
      sortBy === 'name'
        ? a.name || a.category_name || a.payee_name || ''
        : a.amount || a.totalAmount || 0;
    let valB =
      sortBy === 'name'
        ? b.name || b.category_name || b.payee_name || ''
        : b.amount || b.totalAmount || 0;

    let cmp = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      cmp = valA.localeCompare(valB);
    } else {
      cmp = Number(valA) - Number(valB);
    }
    return sortAsc ? cmp : -cmp;
  });
};
