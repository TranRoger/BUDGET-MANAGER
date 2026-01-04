import React, { useState, useEffect } from 'react';
import { categoryService, Category } from '../services/categoryService';
import Card from '../components/Card';
import './Categories.css';

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
    <div className="categories-page">
      <div className="page-header">
        <h1 className="page-title">Quản Lý Danh Mục</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Thêm Danh Mục'}
        </button>
      </div>

      {showForm && (
        <Card className="form-card">
          <h3>{editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h3>
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
              <label>Tên danh mục</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Ăn uống, Lương tháng..."
                required
              />
            </div>

            <div className="form-group">
              <label>Loại</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                >
                  💸 Chi tiêu
                </button>
                <button
                  type="button"
                  className={`type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                >
                  💰 Thu nhập
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Màu sắc</label>
              <div className="color-picker">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-btn ${formData.color === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="form-preview">
              <span>Xem trước:</span>
              <div className="category-preview" style={{ borderLeftColor: formData.color }}>
                <span className="preview-icon">{formData.icon}</span>
                <span className="preview-name">{formData.name || 'Tên danh mục'}</span>
                <span className={`preview-type ${formData.type}`}>
                  {formData.type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="loading">Đang tải danh mục...</div>
      ) : (
        <div className="categories-sections">
          <div className="category-section">
            <h2 className="section-title">
              <span className="section-icon">💸</span>
              Chi Tiêu ({expenseCategories.length})
            </h2>
            <div className="categories-grid">
              {expenseCategories.length === 0 ? (
                <p className="empty-message">Chưa có danh mục chi tiêu</p>
              ) : (
                expenseCategories.map((category) => (
                  <Card key={category.id} className="category-card" style={{ borderLeftColor: category.color }}>
                    <div className="category-info">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <div className="category-actions">
                      <button className="btn-icon" onClick={() => handleEdit(category)} title="Sửa">
                        ✏️
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(category.id)} title="Xóa">
                        🗑️
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="category-section">
            <h2 className="section-title">
              <span className="section-icon">💰</span>
              Thu Nhập ({incomeCategories.length})
            </h2>
            <div className="categories-grid">
              {incomeCategories.length === 0 ? (
                <p className="empty-message">Chưa có danh mục thu nhập</p>
              ) : (
                incomeCategories.map((category) => (
                  <Card key={category.id} className="category-card" style={{ borderLeftColor: category.color }}>
                    <div className="category-info">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <div className="category-actions">
                      <button className="btn-icon" onClick={() => handleEdit(category)} title="Sửa">
                        ✏️
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(category.id)} title="Xóa">
                        🗑️
                      </button>
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
