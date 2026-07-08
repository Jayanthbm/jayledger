import {
  getTransactionDate,
  toSupabaseTransactionTimestamp,
} from '../../src/utils/transactionTimestamp';

describe('toSupabaseTransactionTimestamp', () => {
  it('normalizes local timestamp separators without shifting the time', () => {
    expect(toSupabaseTransactionTimestamp('2026-04-11 09:30:00')).toBe('2026-04-11T09:30:00');
  });

  it('removes timezone suffixes after converting to local database format', () => {
    expect(toSupabaseTransactionTimestamp('2026-04-11T09:30:00Z')).toMatch(
      /^2026-04-11T\d{2}:00:00\.000$/,
    );
  });
});

describe('getTransactionDate', () => {
  it('reads the date from local transaction timestamps without timezone conversion', () => {
    expect(getTransactionDate('2026-04-11 23:30:00')).toBe('2026-04-11');
  });

  it('falls back to parsing timestamps that do not start with a date', () => {
    expect(getTransactionDate('Sat, 11 Apr 2026 09:30:00 GMT')).toBe('2026-04-11');
  });
});
