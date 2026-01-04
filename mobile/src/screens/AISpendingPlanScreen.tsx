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
import { aiService, SpendingPlan } from '../services/aiService';
import { budgetService } from '../services/budgetService';
import { formatCurrency } from '../utils/formatters';

const AISpendingPlanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [plan, setPlan] = useState<SpendingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [calculatedIncome, setCalculatedIncome] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    loadCurrentPlan();
    calculateMonthlyIncome();
  }, []);

  const calculateMonthlyIncome = async () => {
    try {
      const budgets = await budgetService.getAll();
      const now = new Date();
      
      const activeBudgets = budgets.filter(budget => {
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);
        return now >= startDate && now <= endDate;
      });
      
      let monthlyTotal = 0;
      activeBudgets.forEach(budget => {
        let amount = budget.amount;
        
        switch(budget.period) {
          case 'daily':
            amount = amount * 30;
            break;
          case 'weekly':
            amount = amount * 4;
            break;
          case 'yearly':
            amount = amount / 12;
            break;
        }
        
        monthlyTotal += amount;
      });
      
      setCalculatedIncome(monthlyTotal);
    } catch (error) {
      console.error('Failed to calculate monthly income:', error);
    }
  };

  const loadCurrentPlan = async () => {
    try {
      setLoading(true);
      const currentPlan = await aiService.getCurrentPlan();
      if (currentPlan) {
        setPlan(currentPlan);
        setShowForm(false);
      } else {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Failed to load current plan:', error);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (calculatedIncome <= 0) {
      Alert.alert('Lỗi', 'Không tìm thấy thu nhập. Vui lòng thêm ngân sách thu nhập trước.');
      return;
    }
    if (!targetDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày kết thúc kế hoạch');
      return;
    }

    setGenerating(true);
    try {
      const planData = await aiService.generatePlan(calculatedIncome, targetDate, notes);
      setPlan(planData);
      setShowForm(false);
      Alert.alert('Thành công', 'Kế hoạch chi tiêu đã được tạo!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo kế hoạch');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Kế Hoạch Chi Tiêu</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {showForm ? (
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🤖 Tạo Kế Hoạch Chi Tiêu AI</Text>
              <Text style={styles.cardSubtitle}>
                AI sẽ phân tích tình hình tài chính và tạo kế hoạch chi tiêu phù hợp
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Thu Nhập Hàng Tháng (Tự Động)</Text>
                <View style={styles.incomeDisplay}>
                  <Text style={styles.incomeValue}>{formatCurrency(calculatedIncome)}</Text>
                  <Text style={styles.incomeNote}>
                    (Tính từ ngân sách hiện tại)
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày Kết Thúc Kế Hoạch *</Text>
                <TextInput
                  style={styles.input}
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ghi Chú (Tùy Chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ví dụ: Cần tiết kiệm cho kỳ nghỉ, có khoản nợ cần trả..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.generateButton, generating && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateButtonText}>✨ Tạo Kế Hoạch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : plan ? (
          <View style={styles.planContainer}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Kế Hoạch Chi Tiêu</Text>
              <TouchableOpacity onPress={() => setShowForm(true)}>
                <Text style={styles.newPlanButton}>🔄 Tạo Mới</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Thu Nhập Tháng</Text>
                <Text style={styles.summaryValue}>{formatCurrency(plan.monthlyIncome)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng Chi Phí</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(plan.summary.totalMonthlyExpenses)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Chi Phí Cố Định</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(plan.summary.totalFixedExpenses)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng Nợ</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(plan.summary.totalDebt)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                <Text style={styles.summaryLabelBold}>Số Dư Khả Dụng</Text>
                <Text style={styles.summaryValueBold}>
                  {formatCurrency(plan.summary.availableFunds)}
                </Text>
              </View>
            </View>

            <View style={styles.planCard}>
              <Text style={styles.planContentTitle}>📝 Chi Tiết Kế Hoạch</Text>
              <View style={styles.markdownContainer}>
                <Text style={styles.markdownText}>{plan.plan}</Text>
              </View>
            </View>

            {plan.notes && (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>📌 Ghi Chú:</Text>
                <Text style={styles.notesText}>{plan.notes}</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
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
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  incomeDisplay: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  incomeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  incomeNote: {
    fontSize: 12,
    color: '#6b7280',
  },
  generateButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planContainer: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  newPlanButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryRowHighlight: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: -20,
    paddingBottom: 20,
    borderBottomWidth: 0,
    marginTop: 12,
    borderRadius: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  markdownContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  markdownText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  notesCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#78350f',
  },
});

export default AISpendingPlanScreen;
