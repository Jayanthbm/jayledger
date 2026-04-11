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
}

export interface Goal {
  id: string;
  name: string;
  logo: string;
  goal_amount: number;
  current_amount: number;
  user_id: string;
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
}

export interface Category {
  id: string;
  name: string;
  type: string; // 'Income' | 'Expense'
  icon: string;
  app_icon?: string | null;
  user_id: string;
}

export interface Payee {
  id: string;
  name: string;
  logo: string;
  user_id: string;
}

// Supabase session shape minimum
export interface UserSession {
  id: string;
  email?: string;
}
