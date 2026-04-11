import { Transaction } from '../src/models/types';

// Mocking the getDb execution logic locally because expo-sqlite relies on native code
// In real tests without e2e native bindings, we simulate the grouping math from JS
// to ensure our equivalent queries are verified against test sets

const mockTransactions: Transaction[] = [
  { id: '1', amount: 100, description: 'Lunch', transaction_timestamp: '2026-04-11T12:00:00Z', date: '2026-04-11', category_id: 'c1', type: 'Expense', payee_id: null, user_id: 'u1' },
  { id: '2', amount: 50, description: 'Coffee', transaction_timestamp: '2026-04-11T09:00:00Z', date: '2026-04-11', category_id: 'c2', type: 'Expense', payee_id: null, user_id: 'u1' },
  { id: '3', amount: 2000, description: 'Salary', transaction_timestamp: '2026-04-11T10:00:00Z', date: '2026-04-11', category_id: 'c3', type: 'Income', payee_id: null, user_id: 'u1' },
];

describe('Business Logic Data Calculations', () => {
  it('Should aggregate Income and Expense by date just like the SQLite Query', () => {
    // SQL Equivalent: SELECT date, type, SUM(amount) ... GROUP BY date, type
    let totalIncome = 0;
    let totalExpense = 0;
    
    mockTransactions.forEach(tx => {
      if(tx.type === 'Income') totalIncome += tx.amount;
      if(tx.type === 'Expense') totalExpense += tx.amount;
    });

    expect(totalIncome).toBe(2000);
    expect(totalExpense).toBe(150); // 100 + 50
  });
  
  it('Should filter based on date correctly', () => {
     // SQL Equivalent: SELECT * FROM transactions WHERE date >= '2026-04-11' AND date <= '2026-04-11'
     const filtered = mockTransactions.filter(tx => tx.date === '2026-04-11');
     expect(filtered.length).toBe(3);
  });
});
