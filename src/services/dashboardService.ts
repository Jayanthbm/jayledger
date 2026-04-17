import { 
  getIncomeExpenseSummary, 
  getTransactionsByCategoryForExpense, 
  getNetWorth, 
  getSpentToday 
} from '../db/queries';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  format, 
  differenceInDays, 
  addMonths, 
  getDaysInMonth, 
  subMonths, 
  subYears 
} from 'date-fns';

export interface DashboardMetrics {
  month: { income: number; expense: number };
  prevMonthComp: { income: number; expense: number };
  year: { income: number; expense: number };
  prevYearComp: { income: number; expense: number };
  netWorth: number;
  spentToday: number;
  topCategories: any[];
}

export const processSummary = (summary: any[]) => {
  if (!Array.isArray(summary)) return { income: 0, expense: 0 };
  let inc = 0, exp = 0;
  summary.forEach(s => {
    if (s.type === 'Income') inc = s.totalAmount || 0;
    if (s.type === 'Expense') exp = s.totalAmount || 0;
  });
  return { income: inc, expense: exp };
};

export const fetchDashboardMetrics = async (userId: string): Promise<DashboardMetrics> => {
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Previous Month Comparison (up to same day of month)
  const prevMonthSameDate = subMonths(today, 1);
  const prevMonthStartStr = format(startOfMonth(prevMonthSameDate), 'yyyy-MM-dd');
  const prevMonthDateStr = format(prevMonthSameDate, 'yyyy-MM-dd');

  // Previous Year Comparison (up to same date)
  const prevYearSameDate = subYears(today, 1);
  const prevYearStartStr = format(startOfYear(prevYearSameDate), 'yyyy-MM-dd');
  const prevYearDateStr = format(prevYearSameDate, 'yyyy-MM-dd');

  // Fetching sequentially as requested
  const monthSum = await getIncomeExpenseSummary(userId, monthStart, todayStr);
  const prevMonthSum = await getIncomeExpenseSummary(userId, prevMonthStartStr, prevMonthDateStr);
  const yearSum = await getIncomeExpenseSummary(userId, yearStart, todayStr);
  const prevYearSum = await getIncomeExpenseSummary(userId, prevYearStartStr, prevYearDateStr);

  const topCats = await getTransactionsByCategoryForExpense(userId, monthStart, monthEnd);
  const totalNW = await getNetWorth(userId);
  const todayExp = await getSpentToday(userId, todayStr);

  return {
    month: processSummary(monthSum),
    prevMonthComp: processSummary(prevMonthSum),
    year: processSummary(yearSum),
    prevYearComp: processSummary(prevYearSum),
    topCategories: Array.isArray(topCats) ? topCats.slice(0, 3) : [],
    netWorth: totalNW || 0,
    spentToday: todayExp || 0
  };
};

export const calculateDailyLimit = (metrics: DashboardMetrics) => {
  const today = new Date();
  const monthEnd = endOfMonth(today);
  const remainingDays = differenceInDays(monthEnd, today) + 1;
  const balance = metrics.month.income - metrics.month.expense + metrics.spentToday;
  const limit = remainingDays > 0 ? balance / remainingDays : 0;
  const remainingToday = limit - metrics.spentToday;

  return {
    limit: Math.max(0, limit),
    spentToday: metrics.spentToday,
    remainingToday,
  };
};

export const calculatePayDayInfo = () => {
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const currentDay = today.getDate();
  return {
    daysInMonth,
    currentDay,
    remaining: daysInMonth - currentDay + 1,
    nextMonth: format(addMonths(today, 1), 'MMM 01')
  };
};
