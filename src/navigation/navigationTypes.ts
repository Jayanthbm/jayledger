import { Transaction, QuickTransaction } from '../models/types';

export type RootStackParamList = {
  Login: undefined;
  Main:
    | {
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;
  DailyLimitDetail: undefined;
  CalendarView: undefined;
  AddTransaction:
    | {
        transaction?: Transaction;
        quickTransaction?: QuickTransaction;
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;
  ReportDetail: { title?: string; [key: string]: any } | undefined;
  Categories: undefined;
  Payees: undefined;
  QuickTransactions: undefined;
  AddQuickTransaction:
    | {
        quickTransaction?: QuickTransaction;
      }
    | undefined;
};
