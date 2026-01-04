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
import { useBudgets } from '../hooks/useBudgets';
import { categoryService, Category } from '../services/categoryService';
import { Budget } from '../services/budgetService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const BudgetsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { budgets, loading, createBudget, updateBudget, deleteBudget, refetch } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
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
              style={[styles.budgetItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => handleEdit(budget)}
            >
              <View style={styles.budgetInfo}>
                <Text style={[styles.budgetPeriod, { color: colors.textSecondary }]}>{budget.period.toUpperCase()}</Text>
                <Text style={[styles.budgetAmount, { color: colors.text }]}>{formatCurrency(budget.amount)}</Text>
                <Text style={[styles.budgetDate, { color: colors.textSecondary }]}>
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có ngân sách nào</Text>
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingBudget ? 'Sửa Ngân Sách' : 'Thêm Ngân Sách'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Số Tiền *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Danh Mục *</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                    {formData.category_id === 0
                      ? 'Chọn danh mục'
                      : categories.find(c => c.id === formData.category_id)?.name || 'Chọn danh mục'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Chu Kỳ *</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowPeriodPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                    {formData.period === 'daily' && 'Hàng Ngày'}
                    {formData.period === 'weekly' && 'Hàng Tuần'}
                    {formData.period === 'monthly' && 'Hàng Tháng'}
                    {formData.period === 'yearly' && 'Hàng Năm'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ngày Bắt Đầu *</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                    {formData.start_date || 'Chọn ngày'}
                  </Text>
                  <Text style={styles.dropdownIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ngày Kết Thúc *</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowEndDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                    {formData.end_date || 'Chọn ngày'}
                  </Text>
                  <Text style={styles.dropdownIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
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
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.border }]} onPress={resetForm}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Category Picker Overlay */}
            {showCategoryPicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowCategoryPicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Danh Mục</Text>
                    <TouchableOpacity 
                      onPress={() => setShowCategoryPicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.pickerOption,
                          { borderBottomColor: colors.border },
                          formData.category_id === category.id && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, category_id: category.id });
                          setShowCategoryPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pickerOptionContent}>
                          {Boolean(category.icon) && <Text style={styles.pickerIcon}>{category.icon}</Text>}
                          <Text
                            style={[
                              styles.pickerOptionText,
                              { color: colors.text },
                              formData.category_id === category.id && { color: colors.primary, fontWeight: '600' },
                            ]}
                          >
                            {category.name}
                          </Text>
                        </View>
                        {formData.category_id === category.id && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Period Picker Overlay */}
            {showPeriodPicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowPeriodPicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Chu Kỳ</Text>
                    <TouchableOpacity 
                      onPress={() => setShowPeriodPicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList}>
                    {[
                      { value: 'daily', label: 'Hàng Ngày' },
                      { value: 'weekly', label: 'Hàng Tuần' },
                      { value: 'monthly', label: 'Hàng Tháng' },
                      { value: 'yearly', label: 'Hàng Năm' },
                    ].map((period) => (
                      <TouchableOpacity
                        key={period.value}
                        style={[
                          styles.pickerOption,
                          { borderBottomColor: colors.border },
                          formData.period === period.value && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, period: period.value as any });
                          setShowPeriodPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            { color: colors.text },
                            formData.period === period.value && { color: colors.primary, fontWeight: '600' },
                          ]}
                        >
                          {period.label}
                        </Text>
                        {formData.period === period.value && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Start Date Picker Overlay */}
            {showStartDatePicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowStartDatePicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Ngày Bắt Đầu</Text>
                    <TouchableOpacity 
                      onPress={() => setShowStartDatePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.dateInputRow}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                        value={formData.start_date}
                        onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          setFormData({ ...formData, start_date: new Date().toISOString().split('T')[0] });
                          setShowStartDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>Hôm nay</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const firstDayOfMonth = new Date();
                          firstDayOfMonth.setDate(1);
                          setFormData({ ...formData, start_date: firstDayOfMonth.toISOString().split('T')[0] });
                          setShowStartDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>Đầu tháng</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* End Date Picker Overlay */}
            {showEndDatePicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowEndDatePicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Ngày Kết Thúc</Text>
                    <TouchableOpacity 
                      onPress={() => setShowEndDatePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.dateInputRow}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                        value={formData.end_date}
                        onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const nextMonth = new Date();
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          setFormData({ ...formData, end_date: nextMonth.toISOString().split('T')[0] });
                          setShowEndDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>Sau 1 tháng</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const lastDayOfMonth = new Date();
                          lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1, 0);
                          setFormData({ ...formData, end_date: lastDayOfMonth.toISOString().split('T')[0] });
                          setShowEndDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>Cuối tháng</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
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
  },  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#9ca3af',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  pickerCloseButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  datePickerContent: {
    padding: 20,
  },
  dateInputRow: {
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
  },
  quickDateButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
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
