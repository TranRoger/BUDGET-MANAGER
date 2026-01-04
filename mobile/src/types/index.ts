export interface User {
  id: number;
  email: string;
  name: string;
  ai_api_key?: string;
  ai_model?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name?: string;
  description?: string;
  date: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id?: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  remaining_amount: number;
  type: 'payable' | 'receivable';
  due_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
