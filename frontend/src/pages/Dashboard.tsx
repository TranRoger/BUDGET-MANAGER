import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary } from '../services/reportService';
import { transactionService, Transaction } from '../services/transactionService';
import { aiService, Recommendation } from '../services/aiService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const data = await aiService.getRecommendations();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Fetch summary and recent transactions in parallel
      const [summaryData, transactionsData] = await Promise.all([
        reportService.getSummary(startDate, endDate),
        transactionService.getAll({ limit: 5 })
      ]);
      
      setSummary(summaryData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        <Card title="Recent Transactions">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="recent-transactions">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className={`recent-transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <div className="transaction-description">
                      {transaction.description || 'No description'}
                    </div>
                    <div className="transaction-date">{formatDate(transaction.date)}</div>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              <button 
                className="view-all-btn"
                onClick={() => navigate('/transactions')}
              >
                View All Transactions →
              </button>
            </div>
          ) : (
            <p className="empty-text">No recent transactions</p>
          )}
        </Card>

        <Card title="Category Breakdown">
          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="category-list">
              {summary.categoryBreakdown
                .filter(cat => cat.total > 0)
                .slice(0, 6)
                .map((cat, index) => (
                  <div key={index} className="category-item">
                    <span className="category-name">{cat.name}</span>
                    <span className={`category-amount ${cat.type}`}>
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="empty-text">No category data available</p>
          )}
        </Card>
      </div>

      {/* AI Spending Recommendations */}
      <div className="recommendations-section">
        <div className="recommendations-header">
          <h2 className="section-title">💡 AI Spending Recommendations</h2>
          <button 
            className="btn-refresh"
            onClick={fetchRecommendations}
            disabled={loadingRecommendations}
          >
            {loadingRecommendations ? '⏳ Analyzing...' : '🔄 Refresh'}
          </button>
        </div>
        
        {loadingRecommendations ? (
          <div className="recommendations-loading">
            <div className="spinner-large"></div>
            <p>AI is analyzing your financial data...</p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <Card key={index} className={`recommendation-card priority-${rec.priority}`}>
                <div className="recommendation-header">
                  <div className="recommendation-title-section">
                    <h3 className="recommendation-title">{rec.title}</h3>
                    <span className={`priority-badge ${rec.priority}`}>
                      {rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚠️' : '💡'} 
                      {rec.priority}
                    </span>
                  </div>
                  {rec.potential_savings > 0 && (
                    <div className="potential-savings">
                      Save ${rec.potential_savings.toFixed(0)}/mo
                    </div>
                  )}
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <div className="recommendation-footer">
                  <div className="recommendation-category">
                    📁 {rec.category}
                  </div>
                  <div className="recommendation-action">
                    ✓ {rec.action}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="empty-text">
              <p>No recommendations available yet</p>
              <button className="btn-primary" onClick={fetchRecommendations}>
                Generate Recommendations
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
