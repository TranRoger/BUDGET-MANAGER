import api from './api';
import { Transaction, APIResponse } from '../types';

export const transactionService = {
  getAll: async (filters?: { 
    startDate?: string; 
    endDate?: string; 
    type?: string; 
    category?: string; 
  }) => {
    const response = await api.get<APIResponse<Transaction[]>>('/transactions', {
      params: filters,
    });
    return response.data.data || [];
  },

  getById: async (id: number) => {
    const response = await api.get<APIResponse<Transaction>>(`/transactions/${id}`);
    return response.data.data;
  },

  create: async (transaction: Partial<Transaction>) => {
    const response = await api.post<APIResponse<Transaction>>('/transactions', transaction);
    return response.data;
  },

  update: async (id: number, transaction: Partial<Transaction>) => {
    const response = await api.put<APIResponse<Transaction>>(`/transactions/${id}`, transaction);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<APIResponse>(`/transactions/${id}`);
    return response.data;
  },
};
