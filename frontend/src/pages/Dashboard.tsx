import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/Card';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const data = await reportService.getSummary(startDate, endDate);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <Card className="stat-card income">
          <div className="stat-icon">💵</div>
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatCurrency(summary?.totalIncome || 0)}</div>
        </Card>

        <Card className="stat-card expense">
          <div className="stat-icon">💸</div>
          <div className="stat-label">Total Expense</div>
          <div className="stat-value">{formatCurrency(summary?.totalExpense || 0)}</div>
        </Card>

        <Card className="stat-card savings">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Net Savings</div>
          <div className="stat-value">{formatCurrency(summary?.netSavings || 0)}</div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Category Breakdown">
          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="category-list">
              {summary.categoryBreakdown.slice(0, 5).map((cat, index) => (
                <div key={index} className="category-item">
                  <span className="category-name">{cat.name}</span>
                  <span className={`category-amount ${cat.type}`}>
                    {formatCurrency(cat.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No data available</p>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="quick-actions">
            <button className="action-btn income">
              <span className="action-icon">➕</span>
              Add Income
            </button>
            <button className="action-btn expense">
              <span className="action-icon">➖</span>
              Add Expense
            </button>
            <button className="action-btn budget">
              <span className="action-icon">🎯</span>
              Create Budget
            </button>
            <button className="action-btn ai">
              <span className="action-icon">🤖</span>
              AI Insights
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
