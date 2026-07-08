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

  LivingCostsReport: { title?: string; reportType: string };
  SubscriptionBillsReport: { title?: string; reportType: string };
  PayeeSummaryReport: { title?: string; reportType: string };
  CategorySummaryReport: { title?: string; reportType: string };
  MonthlySummaryReport: { title?: string; reportType: string };
  YearlySummaryReport: { title?: string; reportType: string };
  YearlyCategoryReport: { title?: string; reportType: string };
  YearlyPayeeReport: { title?: string; reportType: string };
  PayeeOverviewReport: { title?: string; reportType: string };
  CategoryOverviewReport: { title?: string; reportType: string };
  Categories: undefined;
  Payees: undefined;
  Groups: undefined;
  QuickTransactions: undefined;
  Settings: undefined;
  AddQuickTransaction:
    | {
        quickTransaction?: QuickTransaction;
      }
    | undefined;
  GroupSummaryReport: { title?: string; reportType: string };
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;
