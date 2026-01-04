import React, { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { categoryService, Category } from '../services/categoryService';
import { Transaction } from '../services/transactionService';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';

const Transactions: React.FC = () => {
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Filter categories by transaction type
  const filteredCategories = categories.filter(c => c.type === formData.type);

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category_id: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      } else {
        await createTransaction({
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Không thể lưu giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      description: transaction.description,
      date: transaction.date.split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (globalThis.confirm('Bạn có chắc muốn xóa giao dịch này?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💳 Giao Dịch</h1>
        <button 
          className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5" 
          onClick={() => {
            if (showForm && !editingTransaction) {
              resetForm();
            } else {
              setEditingTransaction(null);
              setFormData({
                amount: '',
                type: 'expense',
                category_id: 0,
                description: '',
                date: new Date().toISOString().split('T')[0],
              });
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingTransaction ? '✕ Đóng' : '+ Thêm Giao Dịch'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <Card>
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{editingTransaction ? '✏️' : '💰'}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{editingTransaction ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</h2>
                  <p className="text-gray-600 mt-1">{editingTransaction ? 'Cập nhật thông tin giao dịch' : 'Ghi lại thu nhập hoặc chi tiêu'}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.type === 'expense' ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <span className="text-2xl block mb-1">📤</span>
                  <span className="font-semibold">Chi Tiêu</span>
                </button>
                <button
                  type="button"
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${formData.type === 'income' ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  <span className="text-2xl block mb-1">📥</span>
                  <span className="font-semibold">Thu Nhập</span>
                </button>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">💵</span>
                  Số Tiền
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₫</span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">🏷️</span>
                  Danh Mục
                </label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value={0} disabled>-- Chọn danh mục --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {filteredCategories.length === 0 && (
                  <p className="mt-2 text-sm text-orange-600">Chưa có danh mục cho {formData.type === 'expense' ? 'chi tiêu' : 'thu nhập'}. <a href="/categories" className="underline font-medium hover:text-orange-700">Tạo danh mục</a></p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">📝</span>
                  Mô Tả
                </label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Giao dịch này là gì?"
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">📅</span>
                  Ngày Giao Dịch
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  ✕ Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="inline-block animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✓</span>
                      {editingTransaction ? 'Cập Nhật' : 'Thêm Giao Dịch'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card title={`Tất Cả Giao Dịch (${transactions.length})`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Đang tải giao dịch...</p>
            </div>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Card>
    </div>
  );
};

export default Transactions;
