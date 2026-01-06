import api from './api';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: {
    name: string;
    type: string;
    total: number;
  }[];
}

export interface SpendingTrend {
  period: string;
  type: string;
  total: number;
}

export interface BudgetPerformance {
  id: number;
  budget_amount: number;
  category_name: string;
  spent: number;
  remaining: number;
  percentage: number;
  period: string;
  start_date: string;
  end_date: string;
}

export const reportService = {
  async getSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    const response = await api.get('/reports/summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getTrends(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<SpendingTrend[]> {
    const response = await api.get('/reports/trends', {
      params: { startDate, endDate, groupBy },
    });
    return response.data;
  },

  async getBudgetPerformance(): Promise<BudgetPerformance[]> {
    const response = await api.get('/reports/budget-performance');
    return response.data;
  },
};
