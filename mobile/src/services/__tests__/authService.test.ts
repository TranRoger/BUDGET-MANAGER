import { authService } from '../authService';
import api from '../api';

jest.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns user data on success', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockUser,
        },
      });

      const user = await authService.getUser();

      expect(user).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });

    it('returns default user on error', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const user = await authService.getUser();

      expect(user).toEqual({
        id: 1,
        email: 'user@budgetmanager.local',
        name: 'Budget Manager User',
      });
    });
  });

  describe('updateSettings', () => {
    it('updates AI settings successfully', async () => {
      const settings = {
        ai_api_key: 'test-key',
        ai_model: 'gemini-1.5-flash',
      };

      (api.put as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          message: 'Settings updated',
        },
      });

      const result = await authService.updateSettings(settings);

      expect(result.success).toBe(true);
      expect(api.put).toHaveBeenCalledWith('/auth/settings', settings);
    });
  });

  describe('testAIKey', () => {
    it('tests API key successfully', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          message: 'API key is valid',
        },
      });

      const result = await authService.testAIKey('test-key');

      expect(result.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/auth/test-ai-key', { apiKey: 'test-key' });
    });
  });
});
