import React, { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { categoryService, Category } from '../services/categoryService';
import { Transaction } from '../services/transactionService';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import './Transactions.css';

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
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">💳 Giao Dịch</h1>
        <button 
          className="btn-primary" 
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
        <div className="form-card-wrapper">
          <Card className="form-card">
            <div className="form-header">
              <div className="form-header-content">
                <div className="form-icon">{editingTransaction ? '✏️' : '💰'}</div>
                <div>
                  <h2 className="form-title">{editingTransaction ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</h2>
                  <p className="form-subtitle">{editingTransaction ? 'Cập nhật thông tin giao dịch' : 'Ghi lại thu nhập hoặc chi tiêu'}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  <span className="type-icon">📤</span>
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  <span className="type-icon">📥</span>
                  <span>Income</span>
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="amount">
                  <span className="label-icon">💵</span>
                  Amount
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="amount-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  <span className="label-icon">🏷️</span>
                  Danh Mục
                </label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  required
                  className="category-select"
                >
                  <option value={0} disabled>-- Chọn danh mục --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {filteredCategories.length === 0 && (
                  <p className="no-category-hint">Chưa có danh mục cho {formData.type === 'expense' ? 'chi tiêu' : 'thu nhập'}. <a href="/categories">Tạo danh mục</a></p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <span className="label-icon">📝</span>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">
                  <span className="label-icon">📅</span>
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  ✕ Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
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
          <div className="loading">Đang tải giao dịch...</div>
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
