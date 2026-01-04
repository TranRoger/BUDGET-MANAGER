import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary, SpendingTrend, BudgetPerformance } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/Card';

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
    const periods = Array.from(new Set(trends.map(t => t.period))).sort();
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📊 Báo Cáo & Phân Tích</h1>
      </div>

      {/* Date Filter */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setPresetRange('week')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">7 ngày</button>
            <button onClick={() => setPresetRange('month')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">Tháng này</button>
            <button onClick={() => setPresetRange('3months')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">3 tháng</button>
            <button onClick={() => setPresetRange('6months')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">6 tháng</button>
            <button onClick={() => setPresetRange('year')} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium text-sm">Năm nay</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Đang tải báo cáo...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-green-50 rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="text-4xl mb-3">📥</div>
              <span className="block text-sm text-gray-600 font-medium mb-1">Tổng Thu Nhập</span>
              <span className="block text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</span>
            </div>
            <div className="bg-red-50 rounded-2xl shadow-lg p-6 border border-red-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="text-4xl mb-3">📤</div>
              <span className="block text-sm text-gray-600 font-medium mb-1">Tổng Chi Tiêu</span>
              <span className="block text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</span>
            </div>
            <div className={`${(summary?.netSavings || 0) >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}>
              <div className="text-4xl mb-3">{(summary?.netSavings || 0) >= 0 ? '💰' : '⚠️'}</div>
              <span className="block text-sm text-gray-600 font-medium mb-1">Tiết Kiệm Ròng</span>
              <span className={`block text-2xl font-bold ${(summary?.netSavings || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(summary?.netSavings || 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Income vs Expense Trend */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📈 Xu Hướng Thu Chi</h3>
                <div className="flex gap-2">
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${groupBy === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setGroupBy('day')}
                  >
                    Ngày
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${groupBy === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setGroupBy('week')}
                  >
                    Tuần
                  </button>
                  <button 
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${groupBy === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setGroupBy('month')}
                  >
                    Tháng
                  </button>
                </div>
              </div>
              <div className="flex gap-6 mb-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded"></span> Thu nhập
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded"></span> Chi tiêu
                </span>
              </div>
              {processedTrends().length === 0 ? (
                <div className="text-center py-12 text-gray-500">Chưa có dữ liệu trong khoảng thời gian này</div>
              ) : (
                <div className="flex items-end justify-around gap-2 h-64 border-b border-l border-gray-200 p-4">
                  {processedTrends().map((item, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 h-full">
                      <div className="flex items-end justify-center gap-1 flex-1 w-full">
                        <div 
                          className="bg-green-500 hover:bg-green-600 transition-colors duration-200 rounded-t w-1/2 relative group cursor-pointer" 
                          style={{ height: `${(item.income / maxTrendValue) * 100}%` }}
                          title={`Thu: ${formatCurrency(item.income)}`}
                        >
                          {item.income > 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-green-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {formatCurrency(item.income)}
                            </span>
                          )}
                        </div>
                        <div 
                          className="bg-red-500 hover:bg-red-600 transition-colors duration-200 rounded-t w-1/2 relative group cursor-pointer" 
                          style={{ height: `${(item.expense / maxTrendValue) * 100}%` }}
                          title={`Chi: ${formatCurrency(item.expense)}`}
                        >
                          {item.expense > 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-red-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {formatCurrency(item.expense)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">{item.period}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Category Breakdown - Pie Chart */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4">🥧 Chi Tiêu Theo Danh Mục</h3>
              {expenseCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Chưa có chi tiêu trong khoảng thời gian này</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="w-64 h-64 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform hover:scale-105 transition-transform duration-300">
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
                              className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                            >
                              <title>{category.name}: {formatCurrency(Number(category.total))} ({percent.toFixed(1)}%)</title>
                            </path>
                          );
                        });
                      })()}
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {expenseCategories.slice(0, 8).map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-center gap-2 flex-1">
                          <span 
                            className="w-4 h-4 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                          ></span>
                          <span className="text-sm font-medium text-gray-700 truncate">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(category.total))}</span>
                          <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                            {((Number(category.total) / totalCategoryExpense) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {expenseCategories.length > 8 && (
                      <div className="text-center text-sm text-gray-500 pt-2">+{expenseCategories.length - 8} danh mục khác</div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Budget Performance */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Hiệu Suất Ngân Sách</h3>
              {budgetPerformance.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Chưa có ngân sách nào. <a href="/budgets" className="text-primary-600 font-semibold hover:underline">Tạo ngân sách</a>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetPerformance.map((budget) => {
                    const percentage = Math.min(budget.percentage, 100);
                    const isOverBudget = budget.percentage > 100;
                    const status = budget.percentage < 70 ? 'good' : budget.percentage < 90 ? 'warning' : 'danger';
                    const statusColors = {
                      good: 'bg-green-500',
                      warning: 'bg-yellow-500',
                      danger: 'bg-red-500'
                    };
                    
                    return (
                      <div key={budget.id} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-semibold text-gray-900">{budget.category_name || 'Tổng chi tiêu'}</span>
                            <span className="ml-3 text-sm text-gray-500">{budget.period}</span>
                          </div>
                          <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : status === 'good' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {isOverBudget && '⚠️ '}{budget.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full ${statusColors[status]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}
                          </span>
                          <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                            {isOverBudget ? (
                              <>Vượt: {formatCurrency(Math.abs(budget.remaining))}</>
                            ) : (
                              <>Còn lại: {formatCurrency(budget.remaining)}</>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Category Details Table */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Chi Tiết Theo Danh Mục</h3>
              {summary?.categoryBreakdown.filter(c => Number(c.total) > 0).length === 0 ? (
                <div className="text-center py-12 text-gray-500">Chưa có giao dịch trong khoảng thời gian này</div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-t-lg font-semibold text-sm text-gray-700 border-b border-gray-200">
                    <span>Danh mục</span>
                    <span>Loại</span>
                    <span>Tổng tiền</span>
                    <span>Tỷ lệ</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {summary?.categoryBreakdown
                      .filter(c => Number(c.total) > 0)
                      .map((category, index) => {
                        const total = category.type === 'expense' ? summary.totalExpense : summary.totalIncome;
                        const percent = total > 0 ? (Number(category.total) / total) * 100 : 0;
                        return (
                          <div key={index} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                            <span className="font-medium text-gray-900">{category.name}</span>
                            <span className={`inline-flex items-center gap-1 ${category.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                              {category.type === 'expense' ? '📤 Chi tiêu' : '📥 Thu nhập'}
                            </span>
                            <span className="font-bold text-gray-900">{formatCurrency(Number(category.total))}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${category.type === 'expense' ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-600 w-12 text-right">{percent.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
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
