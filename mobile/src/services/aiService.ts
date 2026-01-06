import api from './api';

export interface AIInsight {
  insights: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FunctionCall {
  functionCall: {
    name: string;
    args: any;
  };
  functionResponse?: {
    name: string;
    response: any;
  };
}

export interface ChatResponse {
  message: string;
  timestamp?: string;
  functionCalls?: FunctionCall[];
}

export interface Recommendation {
  title: string;
  description: string;
  category: string;
  potential_savings: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface SpendingPlan {
  id?: number;
  plan: string; // Markdown content
  targetDate: string;
  monthlyIncome: number;
  notes?: string;
  summary: {
    totalMonthlyExpenses: number;
    totalFixedExpenses: number;
    totalDebt: number;
    availableFunds: number;
    goalCount: number;
    debtCount: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const aiService = {
  async getInsights(): Promise<AIInsight> {
    const response = await api.post('/ai/insights');
    return response.data;
  },

  async chat(message: string, conversationHistory: ChatMessage[]): Promise<ChatResponse> {
    const response = await api.post('/ai/chat', {
      message,
      conversationHistory,
    });
    return response.data;
  },

  async getCurrentPlan(): Promise<SpendingPlan | null> {
    try {
      const response = await api.get('/ai/plan/current');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async calculateMonthlyIncome(): Promise<number> {
    try {
      const response = await api.get('/ai/calculate-income');
      return response.data.monthlyIncome || 0;
    } catch (error) {
      console.error('Failed to calculate monthly income:', error);
      return 0;
    }
  },

  async generatePlan(monthlyIncome: number, targetDate: string, notes?: string): Promise<SpendingPlan> {
    const response = await api.post('/ai/plan', {
      monthlyIncome,
      targetDate,
      notes,
    });
    return response.data;
  },

  async updatePlan(planId: number, updateRequest: string): Promise<SpendingPlan> {
    const response = await api.put(`/ai/plan/${planId}`, {
      updateRequest,
    });
    return response.data;
  },
};
