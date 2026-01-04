import api from './api';
import { Budget, APIResponse } from '../types';

export const budgetService = {
  getAll: async () => {
    const response = await api.get<APIResponse<Budget[]>>('/budgets');
    return response.data.data || [];
  },

  create: async (budget: Partial<Budget>) => {
    const response = await api.post<APIResponse<Budget>>('/budgets', budget);
    return response.data;
  },

  update: async (id: number, budget: Partial<Budget>) => {
    const response = await api.put<APIResponse<Budget>>(`/budgets/${id}`, budget);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<APIResponse>(`/budgets/${id}`);
    return response.data;
  },
};
