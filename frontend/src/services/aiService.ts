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
  generatedAt: string;
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

  async generatePlan(monthlyIncome: number, targetDate: string, notes?: string): Promise<SpendingPlan> {
    const response = await api.post('/ai/plan', {
      monthlyIncome,
      targetDate,
      notes,
    });
    return response.data;
  },
};
