import api from './api';

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  category_name?: string;
  category_type?: 'income' | 'expense';
  category_icon?: string;
  category_color?: string;
}

export interface CreateBudgetData {
  category_id: number;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
}

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    const response = await api.get('/budgets');
    return response.data.data || response.data; // Support both formats
  },

  async create(data: CreateBudgetData): Promise<Budget> {
    const response = await api.post('/budgets', data);
    return response.data.data || response.data;
  },

  async update(id: number, data: Partial<CreateBudgetData>): Promise<Budget> {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data.data || response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },
};
