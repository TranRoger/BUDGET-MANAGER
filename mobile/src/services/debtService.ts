import api from './api';

export interface Debt {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  interest_rate?: number;
  due_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DebtTransaction {
  id: number;
  user_id: number;
  debt_id: number;
  amount: number;
  type: 'payment' | 'increase';
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtTransactionData {
  amount: number;
  type: 'payment' | 'increase';
  description?: string;
  date?: string;
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

  // Debt transactions
  async getTransactions(debtId: number): Promise<DebtTransaction[]> {
    const response = await api.get(`/debts/${debtId}/transactions`);
    return response.data;
  },

  async addTransaction(debtId: number, data: CreateDebtTransactionData): Promise<DebtTransaction> {
    const response = await api.post(`/debts/${debtId}/transactions`, data);
    return response.data;
  },

  async updateTransaction(debtId: number, transactionId: number, data: CreateDebtTransactionData): Promise<DebtTransaction> {
    const response = await api.put(`/debts/${debtId}/transactions/${transactionId}`, data);
    return response.data;
  },

  async deleteTransaction(debtId: number, transactionId: number): Promise<void> {
    await api.delete(`/debts/${debtId}/transactions/${transactionId}`);
  },
};
