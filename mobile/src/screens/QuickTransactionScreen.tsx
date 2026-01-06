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
} from 'react-native';
import { useTransactions } from '../hooks/useTransactions';
import { categoryService, Category } from '../services/categoryService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const QuickTransactionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { transactions, loading, createTransaction, refetch } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      category_id: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    if (!formData.amount || formData.category_id === 0) {
      Alert.alert('Lỗi', 'Vui lòng điền số tiền và chọn danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        ...formData,
        amount: Number.parseFloat(formData.amount),
      });
      Alert.alert('Thành công', 'Đã tạo giao dịch', [
        { text: 'OK', onPress: () => resetForm() }
      ]);
      refetch();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentTransactions = transactions?.slice(0, 3) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>⚡ Tạo Giao Dịch Nhanh</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Form */}
        <View style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Thông Tin Giao Dịch</Text>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: colors.border },
                formData.type === 'expense' && { backgroundColor: colors.dangerLight, borderColor: colors.danger },
              ]}
              onPress={() => setFormData({ ...formData, type: 'expense', category_id: 0 })}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  formData.type === 'expense' && { color: colors.danger, fontWeight: 'bold' },
                ]}
              >
                💸 Chi Tiêu
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                { borderColor: colors.border },
                formData.type === 'income' && { backgroundColor: colors.successLight, borderColor: colors.success },
              ]}
              onPress={() => setFormData({ ...formData, type: 'income', category_id: 0 })}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  formData.type === 'income' && { color: colors.success, fontWeight: 'bold' },
                ]}
              >
                💰 Thu Nhập
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>💵 Số Tiền *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="Nhập số tiền"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>🏷️ Danh Mục *</Text>
            <TouchableOpacity
              style={[styles.categorySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[styles.categorySelectorText, { color: formData.category_id === 0 ? colors.textSecondary : colors.text }]}>
                {formData.category_id === 0
                  ? 'Chọn danh mục'
                  : categories.find(c => c.id === formData.category_id)?.name || 'Chọn danh mục'}
              </Text>
              <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>
                {showCategoryPicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category List */}
          {showCategoryPicker && (
            <View style={[styles.categoryList, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <ScrollView style={styles.categoryListScroll} nestedScrollEnabled={true}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        { borderBottomColor: colors.border },
                        formData.category_id === category.id && { backgroundColor: colors.primaryLight },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, category_id: category.id });
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.emptyCategory, { color: colors.textSecondary }]}>
                    Không có danh mục {formData.type === 'income' ? 'thu nhập' : 'chi tiêu'}
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>📄 Mô Tả</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Ví dụ: Ăn sáng, Lương tháng 1..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>📅 Ngày</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonIcon}>✨</Text>
                <Text style={styles.submitButtonText}>Tạo Giao Dịch</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.recentSection, { backgroundColor: colors.cardBg }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🕐 Giao Dịch Gần Đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.viewAllButton, { color: colors.primary }]}>Chi tiết →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  { borderColor: colors.border },
                  transaction.type === 'income'
                    ? { backgroundColor: colors.successLight, borderLeftColor: colors.success }
                    : { backgroundColor: colors.dangerLight, borderLeftColor: colors.danger },
                ]}
              >
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.text }]}>
                    {transaction.description || 'Không có mô tả'}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {formatDate(transaction.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? colors.success : colors.danger },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Chưa có giao dịch nào
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  categorySelectorText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 12,
  },
  categoryList: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
    overflow: 'hidden',
  },
  categoryListScroll: {
    maxHeight: 200,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
  },
  emptyCategory: {
    padding: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentSection: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default QuickTransactionScreen;
