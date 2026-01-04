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
import Markdown from 'react-native-markdown-display';
import { aiService, SpendingPlan } from '../services/aiService';
import { budgetService } from '../services/budgetService';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const AISpendingPlanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [plan, setPlan] = useState<SpendingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateRequest, setUpdateRequest] = useState<string>('');
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

  const handleUpdatePlan = async () => {
    if (!plan?.id) return;
    if (!updateRequest.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập yêu cầu cập nhật');
      return;
    }

    setGenerating(true);
    try {
      const updatedPlan = await aiService.updatePlan(plan.id, updateRequest);
      setPlan(updatedPlan);
      setShowUpdateForm(false);
      setUpdateRequest('');
      Alert.alert('Thành công', 'Kế hoạch đã được cập nhật!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật kế hoạch');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>📊 Kế Hoạch Chi Tiêu</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {showForm ? (
          <View style={styles.formContainer}>
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>🤖 Tạo Kế Hoạch Chi Tiêu AI</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                AI sẽ phân tích tình hình tài chính và tạo kế hoạch chi tiêu phù hợp
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Thu Nhập Hàng Tháng (Tự Động)</Text>
                <View style={[styles.incomeDisplay, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.incomeValue, { color: colors.primary }]}>{formatCurrency(calculatedIncome)}</Text>
                  <Text style={[styles.incomeNote, { color: colors.textSecondary }]}>
                    (Tính từ ngân sách hiện tại)
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ngày Kết Thúc Kế Hoạch *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ghi Chú (Tùy Chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ví dụ: Cần tiết kiệm cho kỳ nghỉ, có khoản nợ cần trả..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.primary }, generating && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={generating}
              >
                {generating ? (
                  <View style={styles.generateButtonContent}>
                    <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.generateButtonText}>Đang tạo kế hoạch...</Text>
                  </View>
                ) : (
                  <View style={styles.generateButtonContent}>
                    <Text style={styles.generateButtonIcon}>✨</Text>
                    <Text style={styles.generateButtonText}>Tạo Kế Hoạch AI</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : plan ? (
          <View style={styles.planContainer}>
            <View style={[styles.planHeaderCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: colors.primary }]}>
              <View style={styles.planHeaderContent}>
                <Text style={styles.planHeaderIcon}>📊</Text>
                <View style={styles.planHeaderText}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>Kế Hoạch Chi Tiêu</Text>
                  <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>Được tạo bởi AI</Text>
                </View>
              </View>
              <View style={styles.headerButtonsRow}>
                <TouchableOpacity 
                  onPress={() => setShowUpdateForm(!showUpdateForm)}
                  style={[styles.updateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Text style={styles.updateButtonIcon}>✏️</Text>
                  <Text style={[styles.updateButtonText, { color: colors.primary }]}>Cập nhật</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setShowForm(true)}
                  style={[styles.newPlanButton, { backgroundColor: colors.success }]}
                >
                  <Text style={styles.newPlanButtonIcon}>🔄</Text>
                  <Text style={styles.newPlanButtonText}>Tạo Mới</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showUpdateForm && (
              <View style={[styles.updateFormCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <View style={styles.updateFormHeader}>
                  <Text style={styles.updateFormIcon}>🤖</Text>
                  <View>
                    <Text style={[styles.updateFormTitle, { color: colors.primary }]}>Cập nhật Kế hoạch</Text>
                    <Text style={[styles.updateFormSubtitle, { color: colors.textSecondary }]}>Yêu cầu AI điều chỉnh kế hoạch của bạn</Text>
                  </View>
                </View>
                <TextInput
                  style={[styles.updateFormInput, { backgroundColor: colors.inputBg, borderColor: colors.primary, color: colors.text }]}
                  value={updateRequest}
                  onChangeText={setUpdateRequest}
                  placeholder="Ví dụ: Tăng ngân sách ăn uống lên 3 triệu, giảm chi phí giải trí..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.updateFormButtons}>
                  <TouchableOpacity
                    style={[styles.updateSubmitButton, { backgroundColor: colors.primary }, generating && styles.generateButtonDisabled]}
                    onPress={handleUpdatePlan}
                    disabled={generating}
                  >
                    {generating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={styles.updateButtonContent}>
                        <Text style={styles.updateSubmitButtonIcon}>✨</Text>
                        <Text style={styles.updateSubmitButtonText}>Cập nhật</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.updateCancelButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                    onPress={() => {
                      setShowUpdateForm(false);
                      setUpdateRequest('');
                    }}
                  >
                    <Text style={[styles.updateCancelButtonText, { color: colors.textSecondary }]}>✕ Hủy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.summaryCardTitle, { color: colors.text, borderBottomColor: colors.border }]}>💰 Tổng Quan Tài Chính</Text>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.summaryLabelContainer}>
                  <Text style={styles.summaryIcon}>📥</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Thu Nhập Tháng</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(plan.monthlyIncome)}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.summaryLabelContainer}>
                  <Text style={styles.summaryIcon}>📤</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng Chi Phí</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.danger }]}>
                  {formatCurrency(plan.summary.totalMonthlyExpenses)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.summaryLabelContainer}>
                  <Text style={styles.summaryIcon}>📌</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Chi Phí Cố Định</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {formatCurrency(plan.summary.totalFixedExpenses)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.summaryLabelContainer}>
                  <Text style={styles.summaryIcon}>💳</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng Nợ</Text>
                </View>
                <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                  {formatCurrency(plan.summary.totalDebt)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowHighlight, { backgroundColor: colors.primaryLight }]}>
                <View style={styles.summaryLabelContainer}>
                  <Text style={styles.summaryIcon}>💎</Text>
                  <Text style={[styles.summaryLabelBold, { color: colors.text }]}>Số Dư Khả Dụng</Text>
                </View>
                <Text style={[styles.summaryValueBold, { color: colors.primary }]}>
                  {formatCurrency(plan.summary.availableFunds)}
                </Text>
              </View>
            </View>

            <View style={[styles.planCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.planContentTitle, { color: colors.text, borderBottomColor: colors.border }]}>📝 Chi Tiết Kế Hoạch</Text>
              <View style={[styles.markdownContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Markdown
                  style={{
                    body: { color: colors.text },
                    heading1: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 8 },
                    heading2: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginTop: 20, marginBottom: 10 },
                    heading3: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8, backgroundColor: colors.primaryLight, padding: 8, borderRadius: 6, borderLeftWidth: 4, borderLeftColor: colors.primary },
                    heading4: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 6 },
                    paragraph: { fontSize: 15, lineHeight: 24, color: colors.text, marginBottom: 12 },
                    strong: { fontWeight: 'bold', color: colors.text },
                    em: { fontStyle: 'italic', color: colors.primary },
                    list_item: { fontSize: 15, color: colors.text, marginBottom: 8 },
                    bullet_list: { marginBottom: 12 },
                    ordered_list: { marginBottom: 12 },
                    code_inline: { fontFamily: 'monospace', backgroundColor: colors.border, color: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 13 },
                    code_block: { fontFamily: 'monospace', backgroundColor: '#1f2937', color: colors.success, padding: 12, borderRadius: 8, marginVertical: 12, fontSize: 13 },
                    fence: { fontFamily: 'monospace', backgroundColor: '#1f2937', color: colors.success, padding: 12, borderRadius: 8, marginVertical: 12, fontSize: 13 },
                    blockquote: { borderLeftWidth: 4, borderLeftColor: colors.primary, backgroundColor: colors.primaryLight, paddingLeft: 16, paddingRight: 16, paddingVertical: 12, marginVertical: 12, borderRadius: 4 },
                    table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginVertical: 12 },
                    tr: { borderBottomWidth: 1, borderBottomColor: colors.border },
                    th: { fontWeight: 'bold', padding: 12, backgroundColor: colors.primaryLight, color: colors.text },
                    td: { padding: 12, color: colors.text },
                    hr: { backgroundColor: colors.border, height: 2, marginVertical: 16 },
                    link: { color: colors.primary, textDecorationLine: 'underline' },
                  }}
                >
                  {plan.plan}
                </Markdown>
              </View>
            </View>

            {plan.notes && (
              <View style={[styles.notesCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
                <Text style={[styles.notesLabel, { color: colors.warning }]}>📌 Ghi Chú:</Text>
                <Text style={[styles.notesText, { color: colors.warning }]}>{plan.notes}</Text>
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
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  planContainer: {
    padding: 16,
  },
  planHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  planHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planHeaderIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  planHeaderText: {
    flex: 1,
  },
  planTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  updateButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: 'bold',
  },
  newPlanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newPlanButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  newPlanButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  summaryRowHighlight: {
    backgroundColor: '#dbeafe',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom: -24,
    paddingBottom: 24,
    borderBottomWidth: 0,
    marginTop: 12,
    paddingTop: 20,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabelBold: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  planContentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  markdownContainer: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
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
  // Update form styles
  updateFormCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  updateFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateFormIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  updateFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  updateFormSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  updateFormInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#111827',
  },
  updateFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  updateSubmitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  updateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateSubmitButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  updateSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateCancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  updateCancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AISpendingPlanScreen;
