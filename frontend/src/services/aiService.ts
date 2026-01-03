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

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  summary: {
    monthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthly: number;
    totalDebt: number;
    discretionarySpending: number;
    savingsRate: number;
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

  async getRecommendations(): Promise<RecommendationsResponse> {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },
};
