import React, { useState, useEffect } from 'react';
import { reportService, FinancialSummary } from '../services/reportService';
import { transactionService, Transaction } from '../services/transactionService';
import { aiService, SpendingPlan } from '../services/aiService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [plan, setPlan] = useState<SpendingPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updateRequest, setUpdateRequest] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    loadCurrentPlan();
  }, []);

  const loadCurrentPlan = async () => {
    try {
      const currentPlan = await aiService.getCurrentPlan();
      if (currentPlan) {
        setPlan(currentPlan);
        setShowPlanForm(false);
      } else {
        setShowPlanForm(true);
      }
    } catch (error) {
      console.error('Failed to load current plan:', error);
      setShowPlanForm(true);
    }
  };

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
      setShowUpdateForm(false);
      setMonthlyIncome('');
      setTargetDate('');
      setNotes('');
    } catch (error: any) {
      console.error('Failed to generate plan:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Không thể tạo kế hoạch: ${error.response?.data?.message || error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan?.id) {
      alert('Không tìm thấy kế hoạch để cập nhật');
      return;
    }
    if (!updateRequest.trim()) {
      alert('Vui lòng nhập yêu cầu cập nhật');
      return;
    }

    setLoadingPlan(true);
    try {
      const updatedPlan = await aiService.updatePlan(plan.id, updateRequest);
      setPlan(updatedPlan);
      setShowUpdateForm(false);
      setUpdateRequest('');
    } catch (error: any) {
      console.error('Failed to update plan:', error);
      alert(`Không thể cập nhật kế hoạch: ${error.response?.data?.message || error.message || 'Vui lòng thử lại.'}`);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tổng Quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="text-4xl mb-3">💵</div>
          <div className="text-sm text-gray-600 font-medium mb-1">Tổng Thu Nhập</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border border-red-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="text-4xl mb-3">💸</div>
          <div className="text-sm text-gray-600 font-medium mb-1">Tổng Chi Tiêu</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</div>
        </div>

        <div className={`bg-gradient-to-br ${(summary?.netSavings || 0) >= 0 ? 'from-blue-50 to-cyan-50 border-blue-100' : 'from-orange-50 to-yellow-50 border-orange-100'} rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}>
          <div className="text-4xl mb-3">💰</div>
          <div className="text-sm text-gray-600 font-medium mb-1">Tiết Kiệm Ròng</div>
          <div className={`text-2xl font-bold ${(summary?.netSavings || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(summary?.netSavings || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Giao Dịch Gần Đây">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${transaction.type === 'income' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} hover:shadow-md transition-all duration-200`}>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {transaction.description || 'Không có mô tả'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{formatDate(transaction.date)}</div>
                  </div>
                  <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
              <button 
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors duration-200 font-medium"
                onClick={() => navigate('/transactions')}
              >
                Xem Tất Cả →
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
          )}
        </Card>

        <Card title="Phân Loại Chi Tiêu">
          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="space-y-2">
              {summary.categoryBreakdown
                .filter(cat => cat.total > 0)
                .slice(0, 6)
                .map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                    <span className={`font-bold ${cat.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu phân loại</p>
          )}
        </Card>
      </div>

      {/* AI Spending Plan */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🤖 Kế Hoạch Chi Tiêu Thông Minh</h2>
          {!showPlanForm && !showUpdateForm && plan && (
            <div className="flex gap-3">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowUpdateForm(true)}
                disabled={loadingPlan}
              >
                🔄 Cập Nhật Kế Hoạch
              </button>
              <button 
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => { setShowPlanForm(true); setPlan(null); }}
                disabled={loadingPlan}
              >
                ✨ Tạo Kế Hoạch Mới
              </button>
            </div>
          )}
        </div>
        
        {showUpdateForm && plan ? (
          <Card>
            <form onSubmit={handleUpdatePlan} className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="font-semibold text-blue-900 mb-1">🔄 Cập nhật kế hoạch hiện tại</p>
                <p className="text-sm text-blue-700">Kế hoạch sẽ được đồng bộ với dữ liệu tài chính mới nhất và điều chỉnh theo yêu cầu của bạn.</p>
              </div>
              
              <div>
                <label htmlFor="updateRequest" className="block text-sm font-medium text-gray-700 mb-2">
                  Yêu cầu cập nhật <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="updateRequest"
                  value={updateRequest}
                  onChange={(e) => setUpdateRequest(e.target.value)}
                  placeholder="Ví dụ: Thêm kế hoạch mua laptop 20 triệu, giảm chi tiêu giải trí, tăng tiết kiệm..."
                  rows={6}
                  required
                  disabled={loadingPlan}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={loadingPlan}>
                  {loadingPlan ? '⏳ Đang cập nhật...' : '🔄 Cập Nhật'}
                </button>
                <button 
                  type="button" 
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => { setShowUpdateForm(false); setUpdateRequest(''); }}
                  disabled={loadingPlan}
                >
                  Hủy
                </button>
              </div>
            </form>
          </Card>
        ) : showPlanForm ? (
          <Card>
            <form onSubmit={handleGeneratePlan} className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-4 rounded-lg">
                <p className="text-purple-900 font-medium">🎯 Để AI tạo kế hoạch chi tiêu tối ưu, vui lòng cung cấp thông tin:</p>
              </div>
              
              <div>
                <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-2">
                  Thu nhập hàng tháng (VNĐ) <span className="text-red-500">*</span>
                </label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Lập kế hoạch đến ngày <span className="text-red-500">*</span>
                </label>
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loadingPlan}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú bổ sung (tùy chọn)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Dự định mua xe, chi phí y tế sắp tới, kế hoạch du lịch..."
                  rows={4}
                  disabled={loadingPlan}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                />
              </div>

              <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={loadingPlan}>
                {loadingPlan ? '⏳ Đang tạo kế hoạch...' : '✨ Tạo Kế Hoạch'}
              </button>
            </form>
          </Card>
        ) : loadingPlan ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-600">AI đang phân tích dữ liệu tài chính của bạn...</p>
          </div>
        ) : plan ? (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="text-center">
                <span className="block text-sm text-gray-600 mb-1">Thu nhập tháng:</span>
                <span className="block text-lg font-bold text-gray-900">{plan.monthlyIncome.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-600 mb-1">Kế hoạch đến:</span>
                <span className="block text-lg font-bold text-gray-900">{new Date(plan.targetDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-600 mb-1">Tiền khả dụng:</span>
                <span className="block text-lg font-bold text-green-600">{plan.summary.availableFunds.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
            
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-table:text-sm">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-900" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-3 mb-2 text-gray-800" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-gray-700" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                  table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props} /></div>,
                  thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                  tr: ({node, ...props}) => <tr {...props} />,
                  th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-700" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-6 border-gray-200" {...props} />,
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
