import { Transaction } from '../models/types';

export interface TransactionHeaderInfo {
  date: string;
  total: number;
  transactions: Transaction[];
}

export type FlashListItem =
  | (Transaction & { itemType: 'transaction' })
  | (TransactionHeaderInfo & { itemType: 'header' });

export const mapTransactionsToFlashList = (rows: Transaction[]) => {
  const grouped = rows.reduce(
    (acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = { date: tx.date, total: 0, transactions: [] };
      acc[tx.date].transactions.push(tx);
      acc[tx.date].total += tx.type === 'Income' ? tx.amount : -tx.amount;
      return acc;
    },
    {} as Record<string, TransactionHeaderInfo>,
  );

  const flattened: FlashListItem[] = [];
  const stickyIndices: number[] = [];
  let currentTotal = 0;

  // Sort groups by date descending, then sort transactions within each group by timestamp descending
  const sortedGroups = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

  sortedGroups.forEach((group) => {
    group.transactions.sort(
      (a, b) =>
        new Date(b.transaction_timestamp).getTime() - new Date(a.transaction_timestamp).getTime(),
    );
    stickyIndices.push(flattened.length);
    flattened.push({ itemType: 'header', ...group });
    group.transactions.forEach((tx) => {
      flattened.push({ itemType: 'transaction', ...tx });
      currentTotal += tx.type === 'Income' ? tx.amount : -tx.amount;
    });
  });

  return {
    listData: flattened,
    stickyHeaderIndices: stickyIndices,
    totalFiltered: currentTotal,
  };
};
