import React, { useState, useEffect } from 'react';
import { debtService, Debt, CreateDebtData } from '../services/debtService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';

const Debts: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
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
    if (window.confirm('Are you sure you want to delete this debt?')) {
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

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <div className="text-sm text-gray-600 mb-1">Total Debt</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(parseFloat(stats.total_amount))}</div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-sm text-gray-600 mb-1">Active Debts</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_debts}</div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm text-gray-600 mb-1">Avg Interest</div>
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
                <h2 className="text-xl font-semibold text-gray-900">{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h2>
                <p className="text-gray-500 text-sm">Track and manage your debts</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📌</span>
                Debt Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Credit Card, Car Loan"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">💵</span>
                  Amount
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
                  Interest Rate (%)
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
                Due Date
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
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes..."
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
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
              >
                {editingDebt ? 'Update Debt' : 'Add Debt'}
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

              return (
                <div 
                  key={debt.id} 
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    isDueSoon ? 'border-yellow-300 bg-yellow-50' : 
                    'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{debt.name}</h3>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {debt.interest_rate && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                            {debt.interest_rate}% interest
                          </span>
                        )}
                        {debt.due_date && (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isOverdue ? 'bg-red-100 text-red-700' : 
                            isDueSoon ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : 
                             isDueSoon ? `Due in ${daysUntilDue} days` :
                             `Due ${formatDate(debt.due_date)}`}
                          </span>
                        )}
                      </div>
                      {debt.description && (
                        <p className="text-gray-600 text-sm">{debt.description}</p>
                      )}
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-red-600 mb-4">{formatCurrency(debt.amount)}</div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(debt)} 
                          className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-semibold transition-all"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          onClick={() => handleDelete(debt.id)} 
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold transition-all"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
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
