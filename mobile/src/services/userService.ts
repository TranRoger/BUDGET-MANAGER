import api from './api';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

class UserService {
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: { name: string }): Promise<UserProfile> {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/users/change-password', data);
    return response.data;
  }
}

export const userService = new UserService();
