import React, { useState, useEffect } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';
import { formatCurrency } from '../utils/formatters';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ngân Sách</h1>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hủy' : '+ Tạo Ngân Sách'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tạo Ngân Sách Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền giới hạn</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="VD: 5000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chu kỳ</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={submitting}
            >
              {submitting ? 'Đang tạo...' : 'Tạo Ngân Sách'}
            </button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Đang tải ngân sách...</div>
        ) : !Array.isArray(budgets) || budgets.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Chưa có ngân sách nào</p>
              <button 
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
                onClick={() => setShowForm(true)}
              >
                Tạo Ngân Sách Đầu Tiên
              </button>
            </div>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{getCategoryName(budget.category_id)}</h3>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                  {budget.period === 'daily' && 'Hàng ngày'}
                  {budget.period === 'weekly' && 'Hàng tuần'}
                  {budget.period === 'monthly' && 'Hàng tháng'}
                  {budget.period === 'yearly' && 'Hàng năm'}
                </span>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-3">
                {formatCurrency(budget.amount)}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                {new Date(budget.start_date).toLocaleDateString('vi-VN')} - {new Date(budget.end_date).toLocaleDateString('vi-VN')}
              </div>
              <button 
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition-all"
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
