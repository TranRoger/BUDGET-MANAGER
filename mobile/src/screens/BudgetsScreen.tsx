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
import { useBudgets } from '../hooks/useBudgets';
import { categoryService, Category } from '../services/categoryService';
import { Budget } from '../services/budgetService';
import { formatCurrency, formatDate } from '../utils/formatters';

const BudgetsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { budgets, loading, createBudget, updateBudget, deleteBudget, refetch } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category_id: 0,
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category_id: 0,
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.amount || formData.category_id === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      } else {
        await createBudget({
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      }
      resetForm();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu ngân sách. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      amount: budget.amount.toString(),
      category_id: budget.category_id,
      period: budget.period,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date.split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa ngân sách này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(id);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ngân sách');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ngân Sách</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {budgets && budgets.length > 0 ? (
          budgets.map((budget) => (
            <TouchableOpacity
              key={budget.id}
              style={styles.budgetItem}
              onPress={() => handleEdit(budget)}
            >
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetPeriod}>{budget.period.toUpperCase()}</Text>
                <Text style={styles.budgetAmount}>{formatCurrency(budget.amount)}</Text>
                <Text style={styles.budgetDate}>
                  {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(budget.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBudget ? 'Sửa Ngân Sách' : 'Thêm Ngân Sách'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số Tiền *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Danh Mục *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Chọn danh mục" value={0} />
                    {categories.map((cat) => (
                      <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Chu Kỳ *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.period}
                    onValueChange={(value) => setFormData({ ...formData, period: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Hàng Ngày" value="daily" />
                    <Picker.Item label="Hàng Tuần" value="weekly" />
                    <Picker.Item label="Hàng Tháng" value="monthly" />
                    <Picker.Item label="Hàng Năm" value="yearly" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày Bắt Đầu *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.start_date}
                  onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày Kết Thúc *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.end_date}
                  onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingBudget ? 'Cập Nhật' : 'Thêm'}
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
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetPeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  budgetDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 32,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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

export default BudgetsScreen;
