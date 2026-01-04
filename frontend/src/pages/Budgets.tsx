import React, { useState, useEffect } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';
import { formatCurrency } from '../utils/formatters';
import './Budgets.css';

const Budgets: React.FC = () => {
  const { budgets, loading, createBudget, deleteBudget, refetch } = useBudgets();
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data.filter(c => c.type === 'expense'));
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      await createBudget({
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      setShowForm(false);
      setFormData({
        category_id: '',
        amount: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      refetch();
    } catch (error: any) {
      alert(error.message || 'Không thể tạo ngân sách');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa ngân sách này?')) {
      try {
        await deleteBudget(id);
      } catch (error: any) {
        alert(error.message || 'Không thể xóa ngân sách');
      }
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Không xác định';
  };

  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1 className="page-title">Ngân Sách</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Tạo Ngân Sách'}
        </button>
      </div>

      {showForm && (
        <Card className="form-card">
          <h3>Tạo Ngân Sách Mới</h3>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-group">
              <label>Danh mục</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Số tiền giới hạn</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="VD: 5000000"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Chu kỳ</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Ngân Sách'}
            </button>
          </form>
        </Card>
      )}

      <div className="budgets-grid">
        {loading ? (
          <div className="loading">Đang tải ngân sách...</div>
        ) : !Array.isArray(budgets) || budgets.length === 0 ? (
          <Card>
            <div className="empty-state">
              <p>Chưa có ngân sách nào</p>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Tạo Ngân Sách Đầu Tiên
              </button>
            </div>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id} className="budget-card">
              <div className="budget-header">
                <h3>{getCategoryName(budget.category_id)}</h3>
                <span className="budget-period">
                  {budget.period === 'daily' && 'Hàng ngày'}
                  {budget.period === 'weekly' && 'Hàng tuần'}
                  {budget.period === 'monthly' && 'Hàng tháng'}
                  {budget.period === 'yearly' && 'Hàng năm'}
                </span>
              </div>
              <div className="budget-amount">
                {formatCurrency(budget.amount)}
              </div>
              <div className="budget-dates">
                {new Date(budget.start_date).toLocaleDateString('vi-VN')} - {new Date(budget.end_date).toLocaleDateString('vi-VN')}
              </div>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(budget.id)}
              >
                🗑️ Xóa
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Budgets;
