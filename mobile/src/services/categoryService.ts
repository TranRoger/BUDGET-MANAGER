import api from './api';
import { Category, APIResponse } from '../types';

export const categoryService = {
  getAll: async () => {
    const response = await api.get<APIResponse<Category[]>>('/categories');
    return response.data.data || [];
  },

  create: async (category: Partial<Category>) => {
    const response = await api.post<APIResponse<Category>>('/categories', category);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<APIResponse>(`/categories/${id}`);
    return response.data;
  },
};
