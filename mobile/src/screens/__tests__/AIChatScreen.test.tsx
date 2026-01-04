import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AIChatScreen from '../AIChatScreen';
import { aiService } from '../../services/aiService';

// Mock AI service
jest.mock('../../services/aiService');

describe('AIChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty chat state', () => {
    render(<AIChatScreen />);
    
    expect(screen.getByText('🤖')).toBeTruthy();
    expect(screen.getByText('Trợ Lý AI Tài Chính')).toBeTruthy();
  });

  it('sends message and displays response', async () => {
    const mockResponse = {
      success: true,
      data: {
        response: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      },
    };

    (aiService.chat as jest.Mock).mockResolvedValue(mockResponse);

    render(<AIChatScreen />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    const sendButton = screen.getByText('➤');

    fireEvent.changeText(input, 'Xin chào');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Xin chào')).toBeTruthy();
      expect(screen.getByText('Xin chào! Tôi có thể giúp gì cho bạn?')).toBeTruthy();
    });
  });

  it('disables send button when input is empty', () => {
    render(<AIChatScreen />);

    const sendButton = screen.getByText('➤');
    
    // Button should be disabled (gray background)
    expect(sendButton.parent?.props.disabled).toBe(true);
  });

  it('handles API error gracefully', async () => {
    (aiService.chat as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AIChatScreen />);

    const input = screen.getByPlaceholderText('Nhập tin nhắn...');
    const sendButton = screen.getByText('➤');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Xin lỗi, đã có lỗi xảy ra/i)).toBeTruthy();
    });
  });
});
