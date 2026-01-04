import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, APIResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async logout() {
    await AsyncStorage.removeItem('token');
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user || response.data.data;
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
