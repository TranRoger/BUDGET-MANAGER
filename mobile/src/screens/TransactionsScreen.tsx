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
import { useTransactions } from '../hooks/useTransactions';
import { categoryService, Category } from '../services/categoryService';
import { Transaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const TransactionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { transactions, loading, createTransaction, updateTransaction, deleteTransaction, refetch } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
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

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category_id: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.amount || formData.category_id === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      } else {
        await createTransaction({
          ...formData,
          amount: Number.parseFloat(formData.amount),
        });
      }
      resetForm();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      description: transaction.description,
      date: transaction.date.split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa giao dịch');
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Giao Dịch</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={[
                styles.transactionItem,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
                transaction.type === 'income' 
                  ? { backgroundColor: colors.successLight, borderLeftColor: colors.success } 
                  : { backgroundColor: colors.dangerLight, borderLeftColor: colors.danger },
              ]}
              onPress={() => handleEdit(transaction)}
            >
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionDescription, { color: colors.text }]}>
                  {transaction.description || 'Không có mô tả'}
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDate(transaction.date)}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? colors.success : colors.danger },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(transaction.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có giao dịch nào</Text>
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={resetForm}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.cardBg }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTransaction ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch'}
              </Text>
              <TouchableOpacity onPress={resetForm} activeOpacity={0.7}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, type: 'expense', category_id: 0 })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'expense' && styles.typeButtonTextActive,
                    ]}
                  >
                    💸 Chi Tiêu
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'income' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, type: 'income', category_id: 0 })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'income' && styles.typeButtonTextActive,
                    ]}
                  >
                    💰 Thu Nhập
                  </Text>
                </TouchableOpacity>
              </View>

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
                  onPress={() => {
                    console.log('Category selector pressed');
                    setShowCategoryPicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: formData.category_id === 0 ? colors.textSecondary : colors.text }]}>
                    {formData.category_id === 0
                      ? 'Chọn danh mục'
                      : categories.find(c => c.id === formData.category_id)?.name || 'Chọn danh mục'}
                  </Text>
                  <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mô Tả *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Mô tả giao dịch"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ngày *</Text>
                <TouchableOpacity
                  style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categorySelectorText, { color: colors.text }]}>
                    {formData.date || 'Chọn ngày'}
                  </Text>
                  <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingTransaction ? 'Cập Nhật' : 'Thêm'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: colors.border }]} 
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Category Picker Overlay - Inside Form Modal */}
            {showCategoryPicker && (
              <View style={styles.categoryPickerOverlay}>
                <TouchableOpacity
                  style={styles.categoryPickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowCategoryPicker(false)}
                />
                <View style={[styles.categoryPickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.categoryPickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.categoryPickerTitle, { color: colors.text }]}>Chọn Danh Mục</Text>
                    <TouchableOpacity 
                      onPress={() => setShowCategoryPicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryPickerCloseButton, { color: colors.text }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.categoryList}>
                    {filteredCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          { borderBottomColor: colors.border },
                          formData.category_id === category.id && [styles.categoryOptionSelected, { backgroundColor: colors.primaryLight }],
                        ]}
                        onPress={() => {
                          console.log('Category selected:', category.name);
                          setFormData({ ...formData, category_id: category.id });
                          setShowCategoryPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.categoryOptionContent}>
                          {Boolean(category.icon) && <Text style={styles.categoryIcon}>{category.icon}</Text>}
                          <Text
                            style={[
                              styles.categoryOptionText,
                              { color: colors.text },
                              formData.category_id === category.id && [styles.categoryOptionTextSelected, { color: colors.primary }],
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

            {/* Date Picker Overlay */}
            {showDatePicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Ngày</Text>
                    <TouchableOpacity 
                      onPress={() => setShowDatePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryPickerCloseButton, { color: colors.text }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.dateInputRow}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                        value={formData.date}
                        onChangeText={(text) => setFormData({ ...formData, date: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setFormData({ ...formData, date: new Date().toISOString().split('T')[0] });
                          setShowDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.quickDateButtonText}>Hôm nay</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          setFormData({ ...formData, date: yesterday.toISOString().split('T')[0] });
                          setShowDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.quickDateButtonText}>Hôm qua</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          const lastWeek = new Date();
                          lastWeek.setDate(lastWeek.getDate() - 7);
                          setFormData({ ...formData, date: lastWeek.toISOString().split('T')[0] });
                          setShowDatePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.quickDateButtonText}>7 ngày trước</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  incomeItem: {
    backgroundColor: '#ecfdf5',
    borderLeftColor: '#10b981',
  },
  expenseItem: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#ef4444',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  categoryPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  categoryPickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  categoryPickerModal: {
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
  categoryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  categoryPickerCloseButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: 'bold',
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

export default TransactionsScreen;
