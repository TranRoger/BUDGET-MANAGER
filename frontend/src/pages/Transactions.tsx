import React, { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import './Transactions.css';

const Transactions: React.FC = () => {
  const { transactions, loading, createTransaction, deleteTransaction } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTransaction({
        ...formData,
        amount: Number.parseFloat(formData.amount),
      });
      setShowForm(false);
      setFormData({
        amount: '',
        type: 'expense',
        category_id: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (globalThis.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="form-card-wrapper">
          <Card className="form-card">
            <div className="form-header">
              <div className="form-header-content">
                <div className="form-icon">💰</div>
                <div>
                  <h2 className="form-title">Add New Transaction</h2>
                  <p className="form-subtitle">Track your income or expenses</p>
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
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Add Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card title={`All Transactions (${transactions.length})`}>
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        )}
      </Card>
    </div>
  );
};

export default Transactions;
