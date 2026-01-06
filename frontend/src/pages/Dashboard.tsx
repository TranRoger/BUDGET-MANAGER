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
  const [calculatedIncome, setCalculatedIncome] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updateRequest, setUpdateRequest] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    loadCurrentPlan();
    calculateMonthlyIncome();
  }, []);

  const calculateMonthlyIncome = async () => {
    try {
      const income = await aiService.calculateMonthlyIncome();
      setCalculatedIncome(income);
    } catch (error) {
      console.error('Failed to calculate monthly income:', error);
      setCalculatedIncome(0);
    }
  };

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
    if (calculatedIncome <= 0) {
      alert('Không tìm thấy thu nhập. Vui lòng thêm ngân sách thu nhập trước.');
      return;
    }
    if (!targetDate) {
      alert('Vui lòng chọn ngày kết thúc kế hoạch');
      return;
    }

    setLoadingPlan(true);
    try {
      const planData = await aiService.generatePlan(calculatedIncome, targetDate, notes);
      setPlan(planData);
      setShowPlanForm(false);
      setShowUpdateForm(false);
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">Tổng Quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="text-4xl mb-3">💵</div>
          <div className="text-sm text-gray-600 font-medium mb-1">Tổng Thu Nhập</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
        </div>

        <div className="bg-red-50 rounded-2xl shadow-lg p-6 border border-red-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
          <div className="text-4xl mb-3">💸</div>
          <div className="text-sm text-gray-600 font-medium mb-1">Tổng Chi Tiêu</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</div>
        </div>

        <div className={`${(summary?.netSavings || 0) >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}>
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
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                <p className="text-purple-900 font-semibold mb-2">🎯 AI sẽ tạo kế hoạch chi tiêu tối ưu dựa trên:</p>
                <ul className="text-sm text-purple-700 space-y-1 ml-4">
                  <li>• Thu nhập hàng tháng từ Ngân sách: <span className="font-bold">{formatCurrency(calculatedIncome)}</span></li>
                  <li>• Dữ liệu giao dịch thực tế của bạn</li>
                  <li>• Mục tiêu và ghi chú của bạn</li>
                </ul>
              </div>

              {calculatedIncome <= 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <p className="text-yellow-900 font-medium mb-1">⚠️ Chưa có thu nhập</p>
                  <p className="text-sm text-yellow-700">
                    Vui lòng thêm ngân sách thu nhập trong trang <a href="/budgets" className="underline font-semibold">Ngân Sách</a> trước khi tạo kế hoạch.
                  </p>
                </div>
              )}

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

              <button type="submit" className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={loadingPlan}>
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
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-bold mb-4 pb-3 text-gray-900 border-b-2 border-blue-500" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg sm:text-xl font-bold mt-6 mb-3 text-primary-600 flex items-center gap-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base sm:text-lg font-semibold mt-5 mb-3 text-gray-800 bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-500" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-sm sm:text-base font-semibold mt-4 mb-2 text-gray-700" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-none pl-0 mb-5 space-y-2 sm:space-y-2.5" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-none pl-0 mb-5 space-y-2 sm:space-y-2.5 counter-reset-[item]" {...props} />,
                  li: ({node, children, ...props}) => {
                    const isOrdered = props.className?.includes('ordered');
                    return (
                      <li className="text-gray-700 text-sm sm:text-base flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all" {...props}>
                        <span className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs font-bold ${isOrdered ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                          {isOrdered ? '▶' : '✓'}
                        </span>
                        <span className="flex-1">{children}</span>
                      </li>
                    );
                  },
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto mb-6 rounded-lg shadow-md border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-300" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white" {...props} />,
                  tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                  tr: ({node, ...props}) => <tr className="hover:bg-blue-50 transition-colors" {...props} />,
                  th: ({node, ...props}) => <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-white uppercase tracking-wider" {...props} />,
                  td: ({node, ...props}) => <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 whitespace-nowrap" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900 bg-yellow-100 px-1 rounded" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-blue-600" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-xs sm:text-sm font-mono" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 pr-4 py-3 italic text-gray-700 my-5 rounded-r-lg shadow-sm" {...props} />
                  ),
                  hr: ({node, ...props}) => <hr className="my-8 border-t-2 border-gray-300" {...props} />,
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
