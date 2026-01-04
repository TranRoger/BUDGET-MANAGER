import React, { useState, useEffect } from 'react';
import { debtService, Debt, CreateDebtData, DebtTransaction, CreateDebtTransactionData } from '../services/debtService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';

const Debts: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null);
  const [debtTransactions, setDebtTransactions] = useState<{ [key: number]: DebtTransaction[] }>({});
  const [showTransactionForm, setShowTransactionForm] = useState<number | null>(null);
  const [transactionFormData, setTransactionFormData] = useState<CreateDebtTransactionData>({
    amount: 0,
    type: 'payment',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [formData, setFormData] = useState<CreateDebtData>({
    name: '',
    amount: 0,
    interest_rate: undefined,
    due_date: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [debtsData, statsData] = await Promise.all([
        debtService.getAll(),
        debtService.getStats()
      ]);
      setDebts(debtsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtTransactions = async (debtId: number) => {
    try {
      const transactions = await debtService.getTransactions(debtId);
      setDebtTransactions(prev => ({ ...prev, [debtId]: transactions }));
    } catch (error) {
      console.error('Failed to fetch debt transactions:', error);
    }
  };

  const toggleExpand = (debtId: number) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
    } else {
      setExpandedDebtId(debtId);
      if (!debtTransactions[debtId]) {
        fetchDebtTransactions(debtId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDebt) {
        await debtService.update(editingDebt.id, formData);
      } else {
        await debtService.create(formData);
      }
      setShowForm(false);
      setEditingDebt(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save debt:', error);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent, debtId: number) => {
    e.preventDefault();
    try {
      await debtService.addTransaction(debtId, transactionFormData);
      setShowTransactionForm(null);
      resetTransactionForm();
      fetchData();
      fetchDebtTransactions(debtId);
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleDeleteTransaction = async (debtId: number, transactionId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        await debtService.deleteTransaction(debtId, transactionId);
        fetchData();
        fetchDebtTransactions(debtId);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      amount: debt.amount,
      interest_rate: debt.interest_rate,
      due_date: debt.due_date || '',
      description: debt.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản nợ này?')) {
      try {
        await debtService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete debt:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      interest_rate: undefined,
      due_date: '',
      description: '',
    });
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      amount: 0,
      type: 'payment',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (debt: Debt) => {
    if (!debt.paid_amount) return 0;
    return Math.min((debt.paid_amount / debt.amount) * 100, 100);
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading debts...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💳 Quản Lý Công Nợ</h1>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingDebt(null);
              resetForm();
            }
          }}
        >
          {showForm ? '✕ Đóng' : '+ Thêm Công Nợ'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-sm text-gray-600 mb-1">Tổng Nợ</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(parseFloat(stats.total_amount))}</div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-sm text-gray-600 mb-1">Khoản Nợ Đang Có</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_debts}</div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm text-gray-600 mb-1">Lãi Suất TB</div>
            <div className="text-2xl font-bold text-purple-600">{parseFloat(stats.avg_interest_rate).toFixed(2)}%</div>
          </Card>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💳</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editingDebt ? 'Sửa Công Nợ' : 'Thêm Công Nợ Mới'}</h2>
                <p className="text-gray-500 text-sm">Theo dõi và quản lý các khoản nợ</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📌</span>
                Tên Khoản Nợ
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Thẻ tín dụng, Vay mua xe"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">💵</span>
                  Số Tiền Nợ
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">📊</span>
                  Lãi Suất (%)
                </label>
                <input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  value={formData.interest_rate || ''}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📅</span>
                Ngày Đáo Hạn
              </label>
              <input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📝</span>
                Mô Tả
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ghi chú thêm..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                onClick={() => {
                  setShowForm(false);
                  setEditingDebt(null);
                  resetForm();
                }}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
              >
                {editingDebt ? 'Cập Nhật' : 'Thêm Nợ'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Debts List */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Tất Cả Công Nợ ({debts.length})</h2>
        {debts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-gray-500 mb-6">Chưa có công nợ nào</p>
            <button 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
              onClick={() => setShowForm(true)}
            >
              + Thêm Công Nợ Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt) => {
              const daysUntilDue = debt.due_date ? getDaysUntilDue(debt.due_date) : null;
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;
              const isExpanded = expandedDebtId === debt.id;
              const progress = getProgressPercentage(debt);
              const remaining = debt.remaining_amount || debt.amount;

              return (
                <div 
                  key={debt.id} 
                  className={`rounded-xl border-2 transition-all ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    isDueSoon ? 'border-yellow-300 bg-yellow-50' : 
                    'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{debt.name}</h3>
                          <button
                            onClick={() => toggleExpand(debt.id)}
                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                          >
                            {isExpanded ? '▼ Thu gọn' : '▶ Xem giao dịch'}
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {debt.paid_amount && debt.paid_amount > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Đã trả: {formatCurrency(debt.paid_amount)}</span>
                              <span>Còn lại: {formatCurrency(remaining)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 mb-3">
                          {debt.interest_rate && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                              {debt.interest_rate}% lãi suất
                            </span>
                          )}
                          {debt.due_date && (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              isOverdue ? 'bg-red-100 text-red-700' : 
                              isDueSoon ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {isOverdue ? `Quá hạn ${Math.abs(daysUntilDue!)} ngày` : 
                               isDueSoon ? `Còn ${daysUntilDue} ngày` :
                               `Hạn ${formatDate(debt.due_date)}`}
                            </span>
                          )}
                        </div>
                        {debt.description && (
                          <p className="text-gray-600 text-sm">{debt.description}</p>
                        )}
                      </div>
                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(debt.amount)}</div>
                        <div className="text-sm text-gray-500 mb-4">Tổng nợ</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowTransactionForm(showTransactionForm === debt.id ? null : debt.id);
                              resetTransactionForm();
                            }}
                            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-semibold transition-all text-sm"
                          >
                            💰 Trả nợ
                          </button>
                          <button 
                            onClick={() => handleEdit(debt)} 
                            className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-semibold transition-all text-sm"
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            onClick={() => handleDelete(debt.id)} 
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold transition-all text-sm"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Form */}
                    {showTransactionForm === debt.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Thêm Giao Dịch</h4>
                        <form onSubmit={(e) => handleTransactionSubmit(e, debt.id)} className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                              <select
                                value={transactionFormData.type}
                                onChange={(e) => setTransactionFormData({ ...transactionFormData, type: e.target.value as 'payment' | 'increase' })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                              >
                                <option value="payment">💰 Trả nợ</option>
                                <option value="increase">📈 Tăng nợ</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                              <input
                                type="number"
                                step="0.01"
                                value={transactionFormData.amount}
                                onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                              <input
                                type="date"
                                value={transactionFormData.date}
                                onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                            <input
                              type="text"
                              value={transactionFormData.description}
                              onChange={(e) => setTransactionFormData({ ...transactionFormData, description: e.target.value })}
                              placeholder="Ghi chú về giao dịch..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowTransactionForm(null)}
                              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold"
                            >
                              Thêm
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Expanded Transactions */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-4">Lịch Sử Giao Dịch</h4>
                      {debtTransactions[debt.id] && debtTransactions[debt.id].length > 0 ? (
                        <div className="space-y-2">
                          {debtTransactions[debt.id].map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    transaction.type === 'payment' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {transaction.type === 'payment' ? '💰 Trả nợ' : '📈 Tăng nợ'}
                                  </span>
                                  <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
                                </div>
                                {transaction.description && (
                                  <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${
                                  transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                </span>
                                <button
                                  onClick={() => handleDeleteTransaction(debt.id, transaction.id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Chưa có giao dịch nào</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Debts;
