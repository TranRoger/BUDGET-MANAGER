import api from './api';
import { User, APIResponse } from '../types';

export const authService = {
  // Trong single-user mode, lấy thông tin user mặc định
  getUser: async (): Promise<User> => {
    try {
      const response = await api.get<APIResponse<User>>('/auth/me');
      return response.data.data || {
        id: 1,
        email: 'user@budgetmanager.local',
        name: 'Budget Manager User',
      };
    } catch (error) {
      // Return default user nếu không kết nối được
      return {
        id: 1,
        email: 'user@budgetmanager.local',
        name: 'Budget Manager User',
      };
    }
  },

  // Update user settings (AI API key, model)
  updateSettings: async (settings: { ai_api_key?: string; ai_model?: string }) => {
    const response = await api.put<APIResponse>('/auth/settings', settings);
    return response.data;
  },

  // Test AI API key
  testAIKey: async (apiKey: string) => {
    const response = await api.post<APIResponse>('/auth/test-ai-key', { apiKey });
    return response.data;
  },
};
