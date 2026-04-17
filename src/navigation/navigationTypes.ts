import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Transaction, QuickTransaction } from '../models/types';

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions:
    | {
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;
  Budgets: undefined;
  Goals: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
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
  ReportDetail:
    | {
        title?: string;
        reportType?: string;
        [key: string]: unknown;
      }
    | undefined;
  Categories: undefined;
  Payees: undefined;
  QuickTransactions: undefined;
  Settings: undefined;
  AddQuickTransaction:
    | {
        quickTransaction?: QuickTransaction;
      }
    | undefined;
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;
