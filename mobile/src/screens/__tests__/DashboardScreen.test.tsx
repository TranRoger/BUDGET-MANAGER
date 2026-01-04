import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { transactionService } from '../../services/transactionService';
import { budgetService } from '../../services/budgetService';

// Mock services
jest.mock('../../services/transactionService');
jest.mock('../../services/budgetService');
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    loading: false,
  }),
}));

const mockNavigation = {
  navigate: jest.fn(),
} as any;

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with loading state', () => {
    (transactionService.getAll as jest.Mock).mockResolvedValue([]);
    (budgetService.getAll as jest.Mock).mockResolvedValue([]);

    render(<DashboardScreen navigation={mockNavigation} />);
    
    // Should show loading initially
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays user greeting', async () => {
    (transactionService.getAll as jest.Mock).mockResolvedValue([]);
    (budgetService.getAll as jest.Mock).mockResolvedValue([]);

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText(/Xin chào, Test User!/i)).toBeTruthy();
    });
  });

  it('calculates and displays balance correctly', async () => {
    const mockTransactions = [
      { id: 1, type: 'income', amount: 5000000, category_name: 'Salary' },
      { id: 2, type: 'expense', amount: 2000000, category_name: 'Food' },
    ];

    (transactionService.getAll as jest.Mock).mockResolvedValue(mockTransactions);
    (budgetService.getAll as jest.Mock).mockResolvedValue([]);

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      // Balance should be 3,000,000 VND
      expect(screen.getByText(/3.000.000/)).toBeTruthy();
    });
  });

  it('navigates to transactions screen when quick action is pressed', async () => {
    (transactionService.getAll as jest.Mock).mockResolvedValue([]);
    (budgetService.getAll as jest.Mock).mockResolvedValue([]);

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      const transactionButton = screen.getByText('Giao dịch');
      fireEvent.press(transactionButton);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Transactions');
  });
});
