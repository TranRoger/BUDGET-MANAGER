import api from './api';
import { AIMessage, APIResponse } from '../types';

export const aiService = {
  // Chat with AI assistant
  chat: async (message: string, conversationHistory: AIMessage[] = []) => {
    const response = await api.post<APIResponse>('/ai/chat', {
      message,
      conversationHistory,
    });
    return response.data;
  },

  // Get financial insights
  getInsights: async () => {
    const response = await api.post<APIResponse>('/ai/insights');
    return response.data;
  },

  // Get current spending plan
  getCurrentPlan: async () => {
    const response = await api.get<APIResponse>('/ai/plan/current');
    return response.data;
  },

  // Generate spending plan
  generatePlan: async (monthlyIncome: number, targetDate: string, notes?: string) => {
    const response = await api.post<APIResponse>('/ai/plan', {
      monthlyIncome,
      targetDate,
      notes,
    });
    return response.data;
  },

  // Update spending plan
  updatePlan: async (planId: number, updateRequest: string) => {
    const response = await api.put<APIResponse>(`/ai/plan/${planId}`, {
      updateRequest,
    });
    return response.data;
  },
};
