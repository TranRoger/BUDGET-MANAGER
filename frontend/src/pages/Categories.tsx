import React, { useState, useEffect } from 'react';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: '📦',
    color: '#6b7280',
  });

  const icons = ['🍔', '🚗', '🏠', '💡', '🎬', '🛒', '💊', '📚', '✈️', '👕', '💰', '💼', '🎁', '📱', '💳', '🏥', '🎮', '☕', '🍕', '🚌'];
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        const updated = await categoryService.update(editingCategory.id, formData);
        setCategories(categories.map(c => c.id === editingCategory.id ? updated : c));
      } else {
        const newCategory = await categoryService.create(formData);
        setCategories([...categories, newCategory]);
      }
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Không thể lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này? Các giao dịch liên quan sẽ không bị xóa.')) {
      return;
    }

    try {
      await categoryService.delete(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.message || 'Không thể xóa danh mục');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      icon: '📦',
      color: '#6b7280',
    });
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Danh Mục</h1>
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hủy' : '+ Thêm Danh Mục'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên danh mục</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ăn uống, Lương tháng..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    formData.type === 'expense' 
                      ? 'bg-red-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  💸 Chi tiêu
                </button>
                <button
                  type="button"
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    formData.type === 'income' 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  💰 Thu nhập
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="grid grid-cols-10 gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`text-2xl p-3 rounded-lg hover:bg-gray-100 transition-all ${
                      formData.icon === icon ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-50'
                    }`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
              <div className="grid grid-cols-12 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm font-medium text-gray-700 block mb-3">Xem trước:</span>
              <div 
                className="bg-white p-4 rounded-lg border-l-4 flex items-center gap-3"
                style={{ borderLeftColor: formData.color }}
              >
                <span className="text-2xl">{formData.icon}</span>
                <span className="font-semibold text-gray-900">{formData.name || 'Tên danh mục'}</span>
                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
                  formData.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {formData.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                onClick={resetForm}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải danh mục...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>💸</span>
              Chi Tiêu ({expenseCategories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center py-8">Chưa có danh mục chi tiêu</p>
              ) : (
                expenseCategories.map((category) => (
                  <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-semibold text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                          onClick={() => handleEdit(category)} 
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button 
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" 
                          onClick={() => handleDelete(category.id)} 
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>💰</span>
              Thu Nhập ({incomeCategories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center py-8">Chưa có danh mục thu nhập</p>
              ) : (
                incomeCategories.map((category) => (
                  <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-semibold text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                          onClick={() => handleEdit(category)} 
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button 
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600" 
                          onClick={() => handleDelete(category.id)} 
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
