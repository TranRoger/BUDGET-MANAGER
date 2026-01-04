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

  if (loading) return <div className="loading">Loading debts...</div>;

  return (
    <div className="debts-page">
      <div className="page-header">
        <h1 className="page-title">💳 Quản Lý Công Nợ</h1>
        <button
          className="btn-primary"
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
        <div className="stats-grid">
          <Card className="stat-card debt-total">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Total Debt</div>
            <div className="stat-value">{formatCurrency(parseFloat(stats.total_amount))}</div>
          </Card>
          <Card className="stat-card debt-count">
            <div className="stat-icon">📝</div>
            <div className="stat-label">Active Debts</div>
            <div className="stat-value">{stats.total_debts}</div>
          </Card>
          <Card className="stat-card debt-interest">
            <div className="stat-icon">📈</div>
            <div className="stat-label">Avg Interest</div>
            <div className="stat-value">{parseFloat(stats.avg_interest_rate).toFixed(2)}%</div>
          </Card>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-card-wrapper">
          <Card className="form-card">
            <div className="form-header">
              <div className="form-header-content">
                <div className="form-icon">💳</div>
                <div>
                  <h2 className="form-title">{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h2>
                  <p className="form-subtitle">Track and manage your debts</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="debt-form">
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-icon">📌</span>
                  Debt Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Credit Card, Car Loan"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">
                    <span className="label-icon">💵</span>
                    Amount
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interest_rate">
                    <span className="label-icon">📊</span>
                    Interest Rate (%)
                  </label>
                  <input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || ''}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="due_date">
                  <span className="label-icon">📅</span>
                  Due Date
                </label>
                <input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <span className="label-icon">📝</span>
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDebt(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDebt ? 'Update Debt' : 'Add Debt'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Debts List */}
      <Card title={`Tất Cả Công Nợ (${debts.length})`}>
        {debts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <p>Chưa có công nợ nào</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Thêm Công Nợ Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="debts-list">
            {debts.map((debt) => {
              const daysUntilDue = debt.due_date ? getDaysUntilDue(debt.due_date) : null;
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

              return (
                <div key={debt.id} className={`debt-item ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}`}>
                  <div className="debt-main">
                    <div className="debt-name">{debt.name}</div>
                    <div className="debt-details">
                      {debt.interest_rate && (
                        <span className="debt-interest">{debt.interest_rate}% interest</span>
                      )}
                      {debt.due_date && (
                        <span className={`debt-due ${isOverdue ? 'overdue' : isDueSoon ? 'soon' : ''}`}>
                          {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : 
                           isDueSoon ? `Due in ${daysUntilDue} days` :
                           `Due ${formatDate(debt.due_date)}`}
                        </span>
                      )}
                    </div>
                    {debt.description && <div className="debt-description">{debt.description}</div>}
                  </div>
                  <div className="debt-right">
                    <div className="debt-amount">{formatCurrency(debt.amount)}</div>
                    <div className="debt-actions">
                      <button onClick={() => handleEdit(debt)} className="btn-edit">
                        ✏️ Sửa
                      </button>
                      <button onClick={() => handleDelete(debt.id)} className="btn-delete">
                        🗑️ Xóa
                      </button>
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
