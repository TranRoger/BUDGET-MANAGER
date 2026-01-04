import { aiService } from '../aiService';
import api from '../api';

jest.mock('../api');

describe('aiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chat', () => {
    it('sends chat message successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: 'AI response',
        },
      };

      (api.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await aiService.chat('Hello', []);

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/ai/chat', {
        message: 'Hello',
        conversationHistory: [],
      });
    });

    it('includes conversation history', async () => {
      const history = [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ];

      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      await aiService.chat('New message', history);

      expect(api.post).toHaveBeenCalledWith('/ai/chat', {
        message: 'New message',
        conversationHistory: history,
      });
    });
  });

  describe('getInsights', () => {
    it('fetches financial insights', async () => {
      const mockInsights = {
        success: true,
        data: {
          insights: ['Insight 1', 'Insight 2'],
        },
      };

      (api.post as jest.Mock).mockResolvedValue({ data: mockInsights });

      const result = await aiService.getInsights();

      expect(result).toEqual(mockInsights);
      expect(api.post).toHaveBeenCalledWith('/ai/insights');
    });
  });

  describe('generatePlan', () => {
    it('generates spending plan', async () => {
      const mockPlan = {
        success: true,
        data: {
          plan: 'Generated plan',
        },
      };

      (api.post as jest.Mock).mockResolvedValue({ data: mockPlan });

      const result = await aiService.generatePlan(10000000, '2026-12-31', 'Test notes');

      expect(result).toEqual(mockPlan);
      expect(api.post).toHaveBeenCalledWith('/ai/plan', {
        monthlyIncome: 10000000,
        targetDate: '2026-12-31',
        notes: 'Test notes',
      });
    });
  });
});
