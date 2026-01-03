import api from './api';

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  description: string;
  date: string;
  tags?: string[];
  created_at: string;
}

export interface CreateTransactionData {
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  description: string;
  date: string;
  tags?: string[];
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  categoryId?: number;
}

export const transactionService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateTransactionData>): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};
