import api from './api';

export interface SpendingLimit {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  icon?: string;
  color?: string;
  amount: number;
  spent?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSpendingLimitDto {
  category_id: number;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
}

export const spendingLimitService = {
  getAll: async (): Promise<SpendingLimit[]> => {
    const response = await api.get('/spending-limits');
    return response.data.data;
  },

  getAllWithSpending: async (): Promise<SpendingLimit[]> => {
    const response = await api.get('/spending-limits/with-spending');
    return response.data.data;
  },

  create: async (data: CreateSpendingLimitDto): Promise<SpendingLimit> => {
    const response = await api.post('/spending-limits', data);
    return response.data.data;
  },

  update: async (id: number, data: CreateSpendingLimitDto): Promise<SpendingLimit> => {
    const response = await api.put(`/spending-limits/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/spending-limits/${id}`);
  },
};
