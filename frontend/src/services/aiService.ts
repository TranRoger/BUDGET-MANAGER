import api from './api';

export interface AIInsight {
  insights: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

export interface Recommendation {
  category: string;
  recommendation: string;
  potential_savings: number;
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

  async getRecommendations(): Promise<{ recommendations: string; generatedAt: string }> {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },
};
