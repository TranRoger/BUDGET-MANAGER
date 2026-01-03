import api from './api';

export interface Debt {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  interest_rate?: number;
  due_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtData {
  name: string;
  amount: number;
  interest_rate?: number;
  due_date?: string;
  description?: string;
}

export interface DebtStats {
  total_debts: number;
  total_amount: number;
  avg_interest_rate: number;
}

export const debtService = {
  async getAll(): Promise<Debt[]> {
    const response = await api.get('/debts');
    return response.data;
  },

  async getById(id: number): Promise<Debt> {
    const response = await api.get(`/debts/${id}`);
    return response.data;
  },

  async create(data: CreateDebtData): Promise<Debt> {
    const response = await api.post('/debts', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateDebtData>): Promise<Debt> {
    const response = await api.put(`/debts/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/debts/${id}`);
  },

  async getStats(): Promise<DebtStats> {
    const response = await api.get('/debts/stats/summary');
    return response.data;
  },
};
