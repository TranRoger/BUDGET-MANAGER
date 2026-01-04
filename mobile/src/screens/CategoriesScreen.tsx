import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { categoryService, Category } from '../services/categoryService';

const CategoriesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
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
      Alert.alert('Lỗi', error.message || 'Không thể lưu danh mục');
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
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa danh mục này? Các giao dịch liên quan sẽ không bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.delete(id);
              setCategories(categories.filter(c => c.id !== id));
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa danh mục');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: '📦',
      color: '#6b7280',
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh Mục</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Income Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Thu Nhập ({incomeCategories.length})</Text>
          {incomeCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, { borderLeftColor: category.color }]}
              onPress={() => handleEdit(category)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(category.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expense Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💸 Chi Tiêu ({expenseCategories.length})</Text>
          {expenseCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, { borderLeftColor: category.color }]}
              onPress={() => handleEdit(category)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(category.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                      💸 Chi Tiêu
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActive]}
                    onPress={() => setFormData({ ...formData, type: 'income' })}
                  >
                    <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                      💰 Thu Nhập
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên Danh Mục *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ví dụ: Lương, Ăn uống, Đi lại..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Biểu Tượng</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                  {icons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.iconButton, formData.icon === icon && styles.iconButtonActive]}
                      onPress={() => setFormData({ ...formData, icon })}
                    >
                      <Text style={styles.iconText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Màu Sắc</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        formData.color === color && styles.colorButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingCategory ? 'Cập Nhật' : 'Thêm'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  iconScroll: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconButtonActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  iconText: {
    fontSize: 24,
  },
  colorScroll: {
    flexDirection: 'row',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#111827',
  },
  formButtons: {
    gap: 12,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoriesScreen;
