import { formatCurrency, formatDate, formatTransactionDate } from '../../src/utils/formatters';

describe('formatCurrency', () => {
  it('should format a positive integer correctly without decimals', () => {
    // Note: Assuming APP_CONFIG prefix is ₹
    expect(formatCurrency(1234)).toBe('₹1,234');
  });

  it('should format zero correctly without decimals', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('should format decimals with 2 decimal precision', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('should format numbers with one decimal place into two decimal places', () => {
    expect(formatCurrency(1234.5)).toBe('₹1,234.50');
  });
});

describe('formatDate', () => {
  it('should format an ISO date string correctly', () => {
    expect(formatDate('2026-04-11T12:00:00Z')).toBe('Apr 11, 2026');
  });

  it('should format a Date object correctly', () => {
    const date = new Date(2026, 3, 11); // Month is 0-indexed (April)
    expect(formatDate(date)).toBe('Apr 11, 2026');
  });

  it('should support custom format strings', () => {
    expect(formatDate('2026-04-11T12:00:00Z', 'yyyy-MM-dd')).toBe('2026-04-11');
  });
});

describe('formatTransactionDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-11T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return "Today" for current date', () => {
    expect(formatTransactionDate('2026-04-11')).toBe('Today');
  });

  it('should return "Yesterday" for previous date', () => {
    expect(formatTransactionDate('2026-04-10')).toBe('Yesterday');
  });

  it('should return formatted date for other days', () => {
    expect(formatTransactionDate('2026-04-09')).toBe('Apr 9, 2026');
  });
});
