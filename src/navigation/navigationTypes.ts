import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Transaction, QuickTransaction } from '../models/types';

export type MainTabParamList = {
  dashboard: undefined;
  transactions:
    | {
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;
  budgets: undefined;
  goals: undefined;
  reports: undefined;
  settings: undefined;
};

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': NavigatorScreenParams<MainTabParamList> | undefined;
  'daily-limit-detail': undefined;
  'calendar-view': undefined;
  'add-transaction':
    | {
        transaction?: Transaction;
        quickTransaction?: QuickTransaction;
        initialSelectedCats?: string[];
        initialSelectedPayees?: string[];
        initialStartDate?: string | null;
        initialEndDate?: string | null;
      }
    | undefined;

  'reports/living-costs': { title?: string; reportType: string };
  'reports/subscription-bills': { title?: string; reportType: string };
  'reports/payee-summary': { title?: string; reportType: string };
  'reports/category-summary': { title?: string; reportType: string };
  'reports/monthly-summary': { title?: string; reportType: string };
  'reports/yearly-summary': { title?: string; reportType: string };
  'reports/yearly-category': { title?: string; reportType: string };
  'reports/yearly-payee': { title?: string; reportType: string };
  'reports/payee-overview': { title?: string; reportType: string };
  'reports/category-overview': { title?: string; reportType: string };
  categories: undefined;
  payees: undefined;
  groups: undefined;
  'quick-transactions': undefined;
  settings: undefined;
  'add-quick-transaction':
    | {
        quickTransaction?: QuickTransaction;
      }
    | undefined;
  'reports/group-summary': { title?: string; reportType: string };
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;
