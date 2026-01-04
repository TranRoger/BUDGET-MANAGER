import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary } from '../services/reportService';
import { transactionService, Transaction } from '../services/transactionService';
import { aiService, SpendingPlan } from '../services/aiService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [plan, setPlan] = useState<SpendingPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || Number.parseFloat(monthlyIncome) <= 0) {
      alert('Vui lòng nhập thu nhập hợp lệ');
      return;
    }
    if (!targetDate) {
      alert('Vui lòng chọn ngày kết thúc kế hoạch');
      return;
    }

    setLoadingPlan(true);
    try {
      const planData = await aiService.generatePlan(Number.parseFloat(monthlyIncome), targetDate, notes);
      setPlan(planData);
      setShowPlanForm(false);
    } catch (error: any) {
      console.error('Failed to generate plan:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Không thể tạo kế hoạch: ${error.response?.data?.message || error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setLoadingPlan(false);
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
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Tổng Quan</h1>

      <div className="stats-grid">
        <Card className="stat-card income">
          <div className="stat-icon">💵</div>
          <div className="stat-label">Tổng Thu Nhập</div>
          <div className="stat-value">{formatCurrency(summary?.totalIncome || 0)}</div>
        </Card>

        <Card className="stat-card expense">
          <div className="stat-icon">💸</div>
          <div className="stat-label">Tổng Chi Tiêu</div>
          <div className="stat-value">{formatCurrency(summary?.totalExpense || 0)}</div>
        </Card>

        <Card className="stat-card savings">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Tiết Kiệm Ròng</div>
          <div className="stat-value">{formatCurrency(summary?.netSavings || 0)}</div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Giao Dịch Gần Đây">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="recent-transactions">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className={`recent-transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <div className="transaction-description">
                      {transaction.description || 'Không có mô tả'}
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
                Xem Tất Cả →
              </button>
            </div>
          ) : (
            <p className="empty-text">Chưa có giao dịch nào</p>
          )}
        </Card>

        <Card title="Phân Loại Chi Tiêu">
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
            <p className="empty-text">Chưa có dữ liệu phân loại</p>
          )}
        </Card>
      </div>

      {/* AI Spending Plan */}
      <div className="recommendations-section">
        <div className="recommendations-header">
          <h2 className="section-title">🤖 Kế Hoạch Chi Tiêu Thông Minh</h2>
          {!showPlanForm && plan && (
            <button 
              className="btn-refresh"
              onClick={() => { setShowPlanForm(true); setPlan(null); }}
            >
              📝 Tạo Kế Hoạch Mới
            </button>
          )}
        </div>
        
        {showPlanForm ? (
          <Card>
            <form onSubmit={handleGeneratePlan} className="plan-form">
              <div className="form-intro">
                <p>🎯 Để AI tạo kế hoạch chi tiêu tối ưu, vui lòng cung cấp thông tin:</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="monthlyIncome">Thu nhập hàng tháng (VNĐ) <span className="required">*</span></label>
                <input
                  id="monthlyIncome"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="Ví dụ: 10000000"
                  min="0"
                  step="100000"
                  required
                  disabled={loadingPlan}
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetDate">Lập kế hoạch đến ngày <span className="required">*</span></label>
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loadingPlan}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Ghi chú bổ sung (tùy chọn)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Dự định mua xe, chi phí y tế sắp tới, kế hoạch du lịch..."
                  rows={4}
                  disabled={loadingPlan}
                  className="form-textarea"
                />
              </div>

              <button type="submit" className="btn-generate" disabled={loadingPlan}>
                {loadingPlan ? '⏳ Đang tạo kế hoạch...' : '✨ Tạo Kế Hoạch'}
              </button>
            </form>
          </Card>
        ) : loadingPlan ? (
          <div className="recommendations-loading">
            <div className="spinner-large"></div>
            <p>AI đang phân tích dữ liệu tài chính của bạn...</p>
          </div>
        ) : plan ? (
          <Card className="plan-result-card">
            <div className="plan-summary">
              <div className="plan-summary-item">
                <span className="plan-summary-label">Thu nhập tháng:</span>
                <span className="plan-summary-value">{plan.monthlyIncome.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="plan-summary-item">
                <span className="plan-summary-label">Kế hoạch đến:</span>
                <span className="plan-summary-value">{new Date(plan.targetDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="plan-summary-item">
                <span className="plan-summary-label">Tiền khả dụng:</span>
                <span className="plan-summary-value highlight">{plan.summary.availableFunds.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
            
            <div className="plan-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="md-h1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="md-h2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="md-h3" {...props} />,
                  h4: ({node, ...props}) => <h4 className="md-h4" {...props} />,
                  p: ({node, ...props}) => <p className="md-p" {...props} />,
                  ul: ({node, ...props}) => <ul className="md-ul" {...props} />,
                  ol: ({node, ...props}) => <ol className="md-ol" {...props} />,
                  li: ({node, ...props}) => <li className="md-li" {...props} />,
                  table: ({node, ...props}) => <table className="md-table" {...props} />,
                  thead: ({node, ...props}) => <thead className="md-thead" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="md-tbody" {...props} />,
                  tr: ({node, ...props}) => <tr className="md-tr" {...props} />,
                  th: ({node, ...props}) => <th className="md-th" {...props} />,
                  td: ({node, ...props}) => <td className="md-td" {...props} />,
                  strong: ({node, ...props}) => <strong className="md-strong" {...props} />,
                  em: ({node, ...props}) => <em className="md-em" {...props} />,
                  code: ({node, ...props}) => <code className="md-code" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="md-blockquote" {...props} />,
                  hr: ({node, ...props}) => <hr className="md-hr" {...props} />,
                }}
              >
                {plan.plan}
              </ReactMarkdown>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
