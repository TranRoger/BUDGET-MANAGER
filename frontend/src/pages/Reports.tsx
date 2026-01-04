import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary, SpendingTrend, BudgetPerformance } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/Card';
import './Reports.css';

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trends, setTrends] = useState<SpendingTrend[]>([]);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadReports();
  }, [dateRange, groupBy]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryData, trendsData, budgetData] = await Promise.all([
        reportService.getSummary(dateRange.startDate, dateRange.endDate),
        reportService.getTrends(dateRange.startDate, dateRange.endDate, groupBy),
        reportService.getBudgetPerformance(),
      ]);
      setSummary(summaryData);
      setTrends(trendsData);
      setBudgetPerformance(budgetData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    
    switch (preset) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  // Process trends data for chart
  const processedTrends = () => {
    const periods = [...new Set(trends.map(t => t.period))].sort();
    return periods.map(period => {
      const income = trends.find(t => t.period === period && t.type === 'income')?.total || 0;
      const expense = trends.find(t => t.period === period && t.type === 'expense')?.total || 0;
      return { period, income: Number(income), expense: Number(expense) };
    });
  };

  const maxTrendValue = Math.max(
    ...processedTrends().flatMap(t => [t.income, t.expense]),
    1
  );

  // Get expense categories for pie chart
  const expenseCategories = summary?.categoryBreakdown
    .filter(c => c.type === 'expense' && Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total)) || [];

  const totalCategoryExpense = expenseCategories.reduce((sum, c) => sum + Number(c.total), 0);

  const categoryColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#ec4899'
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">📊 Báo Cáo & Phân Tích</h1>
      </div>

      {/* Date Filter */}
      <Card className="filter-card">
        <div className="filter-section">
          <div className="preset-buttons">
            <button onClick={() => setPresetRange('week')} className="preset-btn">7 ngày</button>
            <button onClick={() => setPresetRange('month')} className="preset-btn">Tháng này</button>
            <button onClick={() => setPresetRange('3months')} className="preset-btn">3 tháng</button>
            <button onClick={() => setPresetRange('6months')} className="preset-btn">6 tháng</button>
            <button onClick={() => setPresetRange('year')} className="preset-btn">Năm nay</button>
          </div>
          <div className="date-inputs">
            <div className="date-field">
              <label>Từ ngày</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="date-field">
              <label>Đến ngày</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="loading">Đang tải báo cáo...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card income">
              <div className="summary-icon">📥</div>
              <div className="summary-content">
                <span className="summary-label">Tổng Thu Nhập</span>
                <span className="summary-value">{formatCurrency(summary?.totalIncome || 0)}</span>
              </div>
            </div>
            <div className="summary-card expense">
              <div className="summary-icon">📤</div>
              <div className="summary-content">
                <span className="summary-label">Tổng Chi Tiêu</span>
                <span className="summary-value">{formatCurrency(summary?.totalExpense || 0)}</span>
              </div>
            </div>
            <div className={`summary-card ${(summary?.netSavings || 0) >= 0 ? 'positive' : 'negative'}`}>
              <div className="summary-icon">{(summary?.netSavings || 0) >= 0 ? '💰' : '⚠️'}</div>
              <div className="summary-content">
                <span className="summary-label">Tiết Kiệm Ròng</span>
                <span className="summary-value">{formatCurrency(summary?.netSavings || 0)}</span>
              </div>
            </div>
          </div>

          <div className="reports-grid">
            {/* Income vs Expense Trend */}
            <Card className="chart-card">
              <div className="chart-header">
                <h3>📈 Xu Hướng Thu Chi</h3>
                <div className="group-selector">
                  <button 
                    className={`group-btn ${groupBy === 'day' ? 'active' : ''}`}
                    onClick={() => setGroupBy('day')}
                  >
                    Ngày
                  </button>
                  <button 
                    className={`group-btn ${groupBy === 'week' ? 'active' : ''}`}
                    onClick={() => setGroupBy('week')}
                  >
                    Tuần
                  </button>
                  <button 
                    className={`group-btn ${groupBy === 'month' ? 'active' : ''}`}
                    onClick={() => setGroupBy('month')}
                  >
                    Tháng
                  </button>
                </div>
              </div>
              <div className="chart-legend">
                <span className="legend-item income">
                  <span className="legend-dot"></span> Thu nhập
                </span>
                <span className="legend-item expense">
                  <span className="legend-dot"></span> Chi tiêu
                </span>
              </div>
              {processedTrends().length === 0 ? (
                <div className="empty-chart">Chưa có dữ liệu trong khoảng thời gian này</div>
              ) : (
                <div className="bar-chart">
                  {processedTrends().map((item, index) => (
                    <div key={index} className="bar-group">
                      <div className="bars">
                        <div 
                          className="bar income" 
                          style={{ height: `${(item.income / maxTrendValue) * 100}%` }}
                          title={`Thu: ${formatCurrency(item.income)}`}
                        >
                          {item.income > 0 && <span className="bar-value">{formatCurrency(item.income)}</span>}
                        </div>
                        <div 
                          className="bar expense" 
                          style={{ height: `${(item.expense / maxTrendValue) * 100}%` }}
                          title={`Chi: ${formatCurrency(item.expense)}`}
                        >
                          {item.expense > 0 && <span className="bar-value">{formatCurrency(item.expense)}</span>}
                        </div>
                      </div>
                      <span className="bar-label">{item.period}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Category Breakdown - Pie Chart */}
            <Card className="chart-card">
              <h3>🥧 Chi Tiêu Theo Danh Mục</h3>
              {expenseCategories.length === 0 ? (
                <div className="empty-chart">Chưa có chi tiêu trong khoảng thời gian này</div>
              ) : (
                <div className="pie-chart-container">
                  <div className="pie-chart">
                    <svg viewBox="0 0 100 100" className="pie-svg">
                      {(() => {
                        let cumulativePercent = 0;
                        return expenseCategories.map((category, index) => {
                          const percent = (Number(category.total) / totalCategoryExpense) * 100;
                          const startX = Math.cos(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                          const startY = Math.sin(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                          cumulativePercent += percent;
                          const endX = Math.cos(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                          const endY = Math.sin(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                          const largeArc = percent > 50 ? 1 : 0;
                          
                          return (
                            <path
                              key={category.name}
                              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                              fill={categoryColors[index % categoryColors.length]}
                              className="pie-slice"
                            >
                              <title>{category.name}: {formatCurrency(Number(category.total))} ({percent.toFixed(1)}%)</title>
                            </path>
                          );
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="pie-legend">
                    {expenseCategories.slice(0, 8).map((category, index) => (
                      <div key={category.name} className="pie-legend-item">
                        <span 
                          className="pie-legend-color" 
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        ></span>
                        <span className="pie-legend-name">{category.name}</span>
                        <span className="pie-legend-value">{formatCurrency(Number(category.total))}</span>
                        <span className="pie-legend-percent">
                          {((Number(category.total) / totalCategoryExpense) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {expenseCategories.length > 8 && (
                      <div className="pie-legend-more">+{expenseCategories.length - 8} danh mục khác</div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Budget Performance */}
            <Card className="chart-card full-width">
              <h3>📊 Hiệu Suất Ngân Sách</h3>
              {budgetPerformance.length === 0 ? (
                <div className="empty-chart">
                  Chưa có ngân sách nào. <a href="/budgets">Tạo ngân sách</a>
                </div>
              ) : (
                <div className="budget-performance-list">
                  {budgetPerformance.map((budget) => {
                    const percentage = Math.min(budget.percentage, 100);
                    const isOverBudget = budget.percentage > 100;
                    const status = budget.percentage < 70 ? 'good' : budget.percentage < 90 ? 'warning' : 'danger';
                    
                    return (
                      <div key={budget.id} className="budget-performance-item">
                        <div className="budget-info">
                          <span className="budget-category">{budget.category_name || 'Tổng chi tiêu'}</span>
                          <span className="budget-period">{budget.period}</span>
                        </div>
                        <div className="budget-progress-container">
                          <div className="budget-progress-bar">
                            <div 
                              className={`budget-progress-fill ${status}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="budget-stats">
                            <span className="budget-spent">
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}
                            </span>
                            <span className={`budget-percentage ${status}`}>
                              {isOverBudget ? '⚠️ ' : ''}{budget.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className={`budget-remaining ${isOverBudget ? 'over' : ''}`}>
                          {isOverBudget ? (
                            <>Vượt: {formatCurrency(Math.abs(budget.remaining))}</>
                          ) : (
                            <>Còn lại: {formatCurrency(budget.remaining)}</>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Category Details Table */}
            <Card className="chart-card full-width">
              <h3>📋 Chi Tiết Theo Danh Mục</h3>
              {summary?.categoryBreakdown.filter(c => Number(c.total) > 0).length === 0 ? (
                <div className="empty-chart">Chưa có giao dịch trong khoảng thời gian này</div>
              ) : (
                <div className="category-table">
                  <div className="table-header">
                    <span>Danh mục</span>
                    <span>Loại</span>
                    <span>Tổng tiền</span>
                    <span>Tỷ lệ</span>
                  </div>
                  {summary?.categoryBreakdown
                    .filter(c => Number(c.total) > 0)
                    .map((category, index) => {
                      const total = category.type === 'expense' ? summary.totalExpense : summary.totalIncome;
                      const percent = total > 0 ? (Number(category.total) / total) * 100 : 0;
                      return (
                        <div key={index} className={`table-row ${category.type}`}>
                          <span className="category-name">{category.name}</span>
                          <span className={`category-type ${category.type}`}>
                            {category.type === 'expense' ? '📤 Chi tiêu' : '📥 Thu nhập'}
                          </span>
                          <span className="category-total">{formatCurrency(Number(category.total))}</span>
                          <span className="category-percent">
                            <div className="mini-bar">
                              <div 
                                className={`mini-bar-fill ${category.type}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
