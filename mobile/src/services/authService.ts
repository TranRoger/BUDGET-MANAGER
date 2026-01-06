import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Admin user management interfaces
export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
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
    return response.data.user;
  },

  // Admin user management methods
  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/auth/admin/users');
    return response.data.users;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await api.post('/auth/admin/users', data);
    return response.data.user;
  },

  async updateUser(userId: number, data: UpdateUserData): Promise<User> {
    const response = await api.put(`/auth/admin/users/${userId}`, data);
    return response.data.user;
  },

  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/auth/admin/users/${userId}`);
  },
};
