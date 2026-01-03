import api from './api';

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },

  async create(data: Omit<Category, 'id' | 'user_id'>): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(id: number, data: Partial<Omit<Category, 'id' | 'user_id'>>): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
