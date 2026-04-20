import { Colors } from '../store/ThemeContext';
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_timestamp: string;
  date: string; // YYYY-MM-DD
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_app_icon?: string | null;
  payee_id: string | null;
  payee_name?: string | null;
  payee_logo?: string | null;
  type: string;
  user_id: string;
  product_link?: string | null;
  tid: number;
  sync_status?: number;
  created_at?: string;
  updated_at?: string;
  deleted?: number;
}

export interface Goal {
  id: string;
  name: string;
  logo: string;
  goal_amount: number;
  current_amount: number;
  user_id: string;
  sync_status?: number;
}

export interface Budget {
  id: string;
  name: string;
  logo: string;
  amount: number;
  interval: string;
  start_date: string;
  categories: string; // JSON string of category IDs
  user_id: string;
  sync_status?: number;
}

export interface Category {
  id: string;
  name: string;
  type: string; // 'Income' | 'Expense'
  icon: string;
  app_icon?: string | null;
  user_id: string;
  is_living_cost?: number;
  sync_status?: number;
}

export interface Payee {
  id: string;
  name: string;
  logo: string;
  user_id: string;
  sync_status?: number;
}

export interface QuickTransaction {
  id: string;
  name: string;
  type: string;
  amount?: number;
  category_id?: string;
  payee_id?: string;
  description?: string;
  user_id: string;
}

// Supabase session shape minimum
export interface UserSession {
  id: string;
  email?: string;
}

export interface ReportItem {
  id?: string;
  name?: string;
  amount?: number;
  totalAmount?: number;
  type?: string;
  category_name?: string;
  category_id?: string;
  payee_name?: string;
  payee_id?: string;
  icon?: string;
  app_icon?: string | null;
  is_living_cost?: number;
  month?: string;
  income?: number;
  expense?: number;
  category_app_icon?: string;
  payee_logo?: string;
  prevAmount?: number;
  diffPercentage?: number;
}

export type ThemeColors = typeof Colors.light;
export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

export interface MonthlyStatsBreakdown {
  month: string;
  income: number;
  expense: number;
}
