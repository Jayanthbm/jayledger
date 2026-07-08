import {
  getReportMonthlyLivingCosts,
  getReportSubscriptionBills,
  getReportSummaryByPayee,
  getReportSummaryByCategory,
  getReportYearlySummaryByCategory,
  getReportYearlySummaryByPayee,
  getReportMonthlySummary,
  getReportYearlySummary,
  getReportPayeesOverview,
  getReportCategoriesOverview,
  getTransactionsByDateRange,
  getAggregatedDataForPeriod,
  getIncomeExpenseSummary,
  getReportSummaryByGroup,
  getReportYearlySummaryByGroup,
  getReportGroupsOverview,
} from '../db/queries';
import { Transaction, ReportItem } from '../models/types';
import { format, endOfMonth, startOfMonth, subMonths, isSameMonth } from 'date-fns';
import { logger } from '../utils/logger';

export const fetchReportData = async (
  userId: string,
  reportType: string,
  type: 'Expense' | 'Income',
  monthStr: string, // 01 to 12
  year: string,
  useFullPreviousPeriod: boolean = false,
): Promise<ReportItem[]> => {
  let currentData: ReportItem[] = [];
  try {
    currentData = await fetchBaseReportData(userId, reportType, type, monthStr, year);
  } catch (baseError) {
    logger.error('Report Base Load Failed:', baseError);
    return [];
  }
  const isSummary = ['monthlySummary', 'yearlySummary'].includes(reportType);

  // Comparison Logic
  const comparisonTypes = [
    'summaryByPayee',
    'summaryByCategory',
    'summaryByGroup',
    'monthlyLivingCosts',
    'subscriptionAndBills',
    'monthlySummary',
    'yearlySummary',
    'transactionsByYear',
    'yearlyPayees',
    'yearlyGroup',
  ];
  if (comparisonTypes.includes(reportType)) {
    const selectedDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
    const isYearly =
      reportType === 'yearlySummary' ||
      reportType === 'transactionsByYear' ||
      reportType === 'yearlyPayees' ||
      reportType === 'yearlyGroup';
    const now = new Date();

    let prevStart = '';
    let prevEnd = '';

    try {
      if (isYearly) {
        const isCurrentYear = parseInt(year) === now.getFullYear();
        const prevYear = parseInt(year) - 1;
        if (isCurrentYear && !useFullPreviousPeriod) {
          // YTD vs YTD comparison
          prevStart = `${prevYear}-01-01`;
          prevEnd = format(new Date(prevYear, now.getMonth(), now.getDate()), 'yyyy-MM-dd');
        } else {
          // Full Year vs Full Year
          prevStart = `${prevYear}-01-01`;
          prevEnd = `${prevYear}-12-31`;
        }
      } else {
        const isCurrentMonth = isSameMonth(selectedDate, now);
        const prevMonthDate = subMonths(selectedDate, 1);
        const prevMonthYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth();

        if (isCurrentMonth && !useFullPreviousPeriod) {
          // MTD vs MTD comparison
          prevStart = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
          prevEnd = format(new Date(prevMonthYear, prevMonth, now.getDate()), 'yyyy-MM-dd');
        } else {
          // Full vs Full
          prevStart = format(startOfMonth(prevMonthDate), 'yyyy-MM-dd');
          prevEnd = format(endOfMonth(prevMonthDate), 'yyyy-MM-dd');
        }
      }
    } catch {
      return currentData;
    }

    let prevData: ReportItem[] = [];
    try {
      if (isSummary) {
        prevData = await getIncomeExpenseSummary(userId, prevStart, prevEnd);
      } else {
        let groupBy: 'payee' | 'category' | 'group' = 'category';
        if (reportType === 'summaryByPayee' || reportType === 'yearlyPayees') groupBy = 'payee';
        else if (reportType === 'summaryByGroup') groupBy = 'group';
        prevData = await getAggregatedDataForPeriod(userId, type, prevStart, prevEnd, groupBy);
      }
    } catch {
      return currentData; // Fallback
    }

    return currentData.map((item: ReportItem) => {
      const name = item.name || item.category_name || item.payee_name || item.type;
      const prevItem = prevData.find((p) => (p.name || p.type) === name);

      const prevAmount = prevItem?.amount || prevItem?.totalAmount || 0;
      const currentAmount = item.amount || item.totalAmount || 0;

      let diffPercentage = 0;
      if (prevAmount > 0) {
        diffPercentage = ((currentAmount - prevAmount) / prevAmount) * 100;
      } else if (currentAmount > 0) {
        diffPercentage = 100;
      }

      return {
        ...item,
        prevAmount,
        diffPercentage,
      };
    });
  }

  return currentData;
};

const fetchBaseReportData = async (
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
    case 'transactionsByYear':
      return await getReportYearlySummaryByCategory(userId, type, year);
    case 'yearlyPayees':
      return await getReportYearlySummaryByPayee(userId, type, year);
    case 'summaryByGroup':
      return await getReportSummaryByGroup(userId, type, monthStr, year);
    case 'yearlyGroup':
      return await getReportYearlySummaryByGroup(userId, type, year);
    case 'groups':
      return await getReportGroupsOverview(userId, type);
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
  const isYearly =
    reportType === 'transactionsByYear' ||
    reportType === 'yearlyPayees' ||
    reportType === 'yearlySummary';

  const fetchStartDate = isOverview ? '1970-01-01' : isYearly ? `${year}-01-01` : startDate;
  const fetchEndDate = isOverview ? '2099-12-31' : isYearly ? `${year}-12-31` : endDate;

  if (
    ['summaryByCategory', 'monthlyLivingCosts', 'categories', 'transactionsByYear'].includes(
      reportType,
    )
  ) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter(
      (t: Transaction) =>
        t.category_name === (item.category_name || item.name) && t.type === (item.type || type),
    );
  } else if (['summaryByPayee', 'payees', 'yearlyPayees'].includes(reportType)) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter(
      (t: Transaction) =>
        t.payee_name === (item.payee_name || item.name) && t.type === (item.type || type),
    );
  } else if (['summaryByGroup', 'yearlyGroup'].includes(reportType)) {
    const all = await getTransactionsByDateRange(userId, fetchStartDate, fetchEndDate);
    return all.filter(
      (t: Transaction) =>
        t.group_name === (item.group_name || item.name) && t.type === (item.type || type),
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
    if (a.priority !== undefined && b.priority !== undefined) {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
    }
    let valA =
      sortBy === 'name'
        ? a.name || a.category_name || a.payee_name || a.group_name || ''
        : a.amount || a.totalAmount || 0;
    let valB =
      sortBy === 'name'
        ? b.name || b.category_name || b.payee_name || b.group_name || ''
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
