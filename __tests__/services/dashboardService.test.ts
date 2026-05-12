jest.mock('../../src/db/queries', () => ({
  getIncomeExpenseSummary: jest.fn(),
  getTransactionsByCategoryForExpense: jest.fn(),
  getNetWorth: jest.fn(),
  getSpentToday: jest.fn(),
}));

import {
  DashboardMetrics,
  processSummary,
  calculateDailyLimit,
  calculatePayDayInfo,
} from '../../src/services/dashboardService';

describe('dashboardService unit tests', () => {
  describe('processSummary', () => {
    it('should correctly aggregate income and expense from list', () => {
      const summary = [
        { type: 'Income', totalAmount: 5000 },
        { type: 'Expense', totalAmount: 2000 },
      ];
      const result = processSummary(summary);
      expect(result.income).toBe(5000);
      expect(result.expense).toBe(2000);
    });

    it('should handle missing types gracefully', () => {
      const summary = [{ type: 'Income', totalAmount: 5000 }];
      const result = processSummary(summary);
      expect(result.income).toBe(5000);
      expect(result.expense).toBe(0);
    });

    it('should handle empty input', () => {
      const result = processSummary([]);
      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
    });
  });

  describe('calculateDailyLimit', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Set to April 15, 2026 (Middle of month)
      // April has 30 days. 15th to 30th is 16 days remaining.
      jest.setSystemTime(new Date('2026-04-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate daily limit correctly with no spending today', () => {
      const metrics: DashboardMetrics = {
        month: { income: 3000, expense: 0 }, // 3000 left
        prevMonthComp: { income: 0, expense: 0 },
        year: { income: 0, expense: 0 },
        prevYearComp: { income: 0, expense: 0 },
        netWorth: 0,
        spentToday: 0,
        topCategories: [],
      };

      const result = calculateDailyLimit(metrics);
      // 3000 income / 16 days = 187.5
      expect(result.limit).toBe(187.5);
      expect(result.remainingToday).toBe(187.5);
      expect(result.remainingPercentage).toBe(100);
    });

    it('should calculate daily limit correctly with existing expenses', () => {
      const metrics: DashboardMetrics = {
        month: { income: 3000, expense: 1000 }, // 2000 left (assuming 1000 spent before today)
        prevMonthComp: { income: 0, expense: 0 },
        year: { income: 0, expense: 0 },
        prevYearComp: { income: 0, expense: 0 },
        netWorth: 0,
        spentToday: 0,
        topCategories: [],
      };

      const result = calculateDailyLimit(metrics);
      // 2000 balance / 16 days = 125
      expect(result.limit).toBe(125);
    });

    it('should calculate remaining percentage correctly when spending occurs', () => {
      const metrics: DashboardMetrics = {
        month: { income: 3000, expense: 100 }, // Total spent is 100
        prevMonthComp: { income: 0, expense: 0 },
        year: { income: 0, expense: 0 },
        prevYearComp: { income: 0, expense: 0 },
        netWorth: 0,
        spentToday: 50, // 50 spent today, 50 spent before
        topCategories: [],
      };

      const result = calculateDailyLimit(metrics);
      // Balance = 3000 - (100 - 50) = 2950
      // Limit = 2950 / 16 = 184.375
      // Remaining = 184.375 - 50 = 134.375
      // Percentage = (134.375 / 184.375) * 100 ~= 72.88
      expect(result.limit).toBe(184.375);
      expect(result.remainingPercentage).toBeCloseTo(72.88, 1);
    });
  });

  describe('calculatePayDayInfo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-04-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return correct relative payday info', () => {
      const result = calculatePayDayInfo();
      expect(result.daysInMonth).toBe(30);
      expect(result.currentDay).toBe(15);
      expect(result.remaining).toBe(16);
      expect(result.nextMonth).toBe('May 01');
    });
  });
});
