import api from './api';

export interface FinancialGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
  description?: string;
}

export interface GoalStats {
  total_goals: number;
  total_target: number;
  total_saved: number;
  total_remaining: number;
  completed_goals: number;
}

export const goalService = {
  async getAll(): Promise<FinancialGoal[]> {
    const response = await api.get('/goals');
    return response.data;
  },

  async getById(id: number): Promise<FinancialGoal> {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  async create(data: CreateGoalData): Promise<FinancialGoal> {
    const response = await api.post('/goals', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateGoalData>): Promise<FinancialGoal> {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/goals/${id}`);
  },

  async updateProgress(id: number, amount: number): Promise<FinancialGoal> {
    const response = await api.patch(`/goals/${id}/progress`, { amount });
    return response.data;
  },

  async getStats(): Promise<GoalStats> {
    const response = await api.get('/goals/stats/summary');
    return response.data;
  },
};
