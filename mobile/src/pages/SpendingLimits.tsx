import React, { useState, useEffect } from 'react';
import { spendingLimitService, SpendingLimit, CreateSpendingLimitDto } from '../services/spendingLimitService';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';
import { formatCurrency } from '../utils/formatters';

const SpendingLimits: React.FC = () => {
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateSpendingLimitDto>({
    category_id: 0,
    amount: 0,
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [limitsData, categoriesData] = await Promise.all([
        spendingLimitService.getAllWithSpending(),
        categoryService.getAll()
      ]);
      setLimits(limitsData);
      setCategories(categoriesData.filter(c => c.type === 'expense'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || formData.amount <= 0) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      await spendingLimitService.create(formData);
      setShowForm(false);
      setFormData({
        category_id: 0,
        amount: 0,
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tạo giới hạn chi tiêu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa giới hạn này?')) {
      try {
        await spendingLimitService.delete(id);
        loadData();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Không thể xóa giới hạn chi tiêu');
      }
    }
  };

  const getPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
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
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎯 Giới Hạn Chi Tiêu</h1>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold text-sm sm:text-base"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hủy' : '+ Thêm Giới Hạn'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Thêm Giới Hạn Chi Tiêu Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục chi tiêu</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              >
                <option value={0}>-- Chọn danh mục --</option>
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
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                placeholder="VD: 5000000"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                min="0"
                step="10000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kỳ hạn</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              disabled={submitting}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang tạo...' : 'Tạo Giới Hạn'}
            </button>
          </form>
        </Card>
      )}

      {limits.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có giới hạn chi tiêu</h3>
            <p className="text-gray-600 mb-6">Thêm giới hạn chi tiêu để kiểm soát ngân sách tốt hơn</p>
            <button 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 font-semibold"
              onClick={() => setShowForm(true)}
            >
              + Thêm Giới Hạn Đầu Tiên
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {limits.map((limit) => {
            const percentage = getPercentage(limit.spent || 0, limit.amount);
            const statusColor = getStatusColor(percentage);
            
            return (
              <Card key={limit.id} className="hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{limit.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{limit.category_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{limit.period === 'monthly' ? 'Hàng tháng' : limit.period === 'weekly' ? 'Hàng tuần' : limit.period === 'daily' ? 'Hàng ngày' : 'Hàng năm'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(limit.id)}
                    className="text-red-600 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đã chi:</span>
                    <span className={`font-bold ${statusColor === 'red' ? 'text-red-600' : statusColor === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {formatCurrency(limit.spent || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giới hạn:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(limit.amount)}</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        statusColor === 'red' ? 'bg-red-500' : statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${statusColor === 'red' ? 'text-red-600' : statusColor === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {percentage.toFixed(1)}% đã sử dụng
                    </span>
                    <span className="text-xs text-gray-500">
                      Còn: {formatCurrency(Math.max(0, limit.amount - (limit.spent || 0)))}
                    </span>
                  </div>

                  {percentage >= 90 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg mt-2">
                      <p className="text-xs text-red-700 font-medium">⚠️ Sắp vượt giới hạn!</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                  <span>{new Date(limit.start_date).toLocaleDateString('vi-VN')}</span>
                  <span>→</span>
                  <span>{new Date(limit.end_date).toLocaleDateString('vi-VN')}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpendingLimits;
