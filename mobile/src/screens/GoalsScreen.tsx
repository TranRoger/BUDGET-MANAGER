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
import { goalService, FinancialGoal, CreateGoalData } from '../services/goalService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const GoalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateGoalData>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    priority: 'medium',
    description: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getAll();
      setGoals(data);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.target_amount) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và số tiền mục tiêu');
      return;
    }

    try {
      setSubmitting(true);
      if (editingGoal) {
        const updated = await goalService.update(editingGoal.id, formData);
        setGoals(goals.map(g => g.id === editingGoal.id ? updated : g));
      } else {
        const newGoal = await goalService.create(formData);
        setGoals([...goals, newGoal]);
      }
      resetForm();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu mục tiêu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      priority: goal.priority,
      description: goal.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa mục tiêu này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await goalService.delete(id);
              setGoals(goals.filter(g => g.id !== id));
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa mục tiêu');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: '',
      priority: 'medium',
      description: '',
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const getProgress = (goal: FinancialGoal) => {
    return (goal.current_amount / goal.target_amount) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
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
        <Text style={[styles.title, { color: colors.text }]}>Mục Tiêu</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {goals && goals.length > 0 ? (
          goals.map((goal) => {
            const progress = getProgress(goal);
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => handleEdit(goal)}
              >
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                    <Text style={styles.priorityText}>
                      {goal.priority === 'high' ? 'Cao' : goal.priority === 'medium' ? 'TB' : 'Thấp'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: colors.success }]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.success }]}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.goalStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã Tiết Kiệm</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(goal.current_amount)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mục Tiêu</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(goal.target_amount)}</Text>
                  </View>
                </View>

                {goal.deadline && (
                  <Text style={[styles.deadline, { color: colors.textSecondary }]}>📅 Hạn: {formatDate(goal.deadline)}</Text>
                )}

                {goal.description && (
                  <Text style={[styles.description, { color: colors.textSecondary }]}>{goal.description}</Text>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(goal.id);
                  }}
                >
                  <Text style={[styles.deleteText, { color: colors.danger }]}>🗑️ Xóa</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có mục tiêu nào</Text>
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingGoal ? 'Sửa Mục Tiêu' : 'Thêm Mục Tiêu'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên Mục Tiêu *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ví dụ: Mua nhà, Du lịch..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Số Tiền Mục Tiêu *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.target_amount.toString()}
                  onChangeText={(text) => setFormData({ ...formData, target_amount: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Số Tiền Hiện Tại</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.current_amount?.toString() || '0'}
                  onChangeText={(text) => setFormData({ ...formData, current_amount: Number(text) || 0 })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mức Độ Ưu Tiên</Text>
                <TouchableOpacity
                  style={[styles.prioritySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowPriorityPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.prioritySelectorText, { color: colors.text }]}>
                    {formData.priority === 'high' && 'Cao'}
                    {formData.priority === 'medium' && 'Trung Bình'}
                    {formData.priority === 'low' && 'Thấp'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Hạn Chốt</Text>
                <TouchableOpacity
                  style={[styles.prioritySelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowDeadlinePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.prioritySelectorText, { color: colors.text }]}>
                    {formData.deadline || 'Chọn ngày'}
                  </Text>
                  <Text style={styles.dropdownIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mô Tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Mô tả mục tiêu..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingGoal ? 'Cập Nhật' : 'Thêm'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.border }]} onPress={resetForm}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Priority Picker Overlay */}
            {showPriorityPicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowPriorityPicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Mức Độ Ưu Tiên</Text>
                    <TouchableOpacity 
                      onPress={() => setShowPriorityPicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerList}>
                    {[
                      { value: 'high', label: 'Cao', emoji: '🔴' },
                      { value: 'medium', label: 'Trung Bình', emoji: '🟡' },
                      { value: 'low', label: 'Thấp', emoji: '🟢' },
                    ].map((priority) => (
                      <TouchableOpacity
                        key={priority.value}
                        style={[
                          styles.pickerOption,
                          { borderBottomColor: colors.border },
                          formData.priority === priority.value && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, priority: priority.value as any });
                          setShowPriorityPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.pickerOptionContent}>
                          <Text style={styles.pickerIcon}>{priority.emoji}</Text>
                          <Text
                            style={[
                              styles.pickerOptionText,
                              { color: colors.text },
                              formData.priority === priority.value && { color: colors.primary, fontWeight: '600' },
                            ]}
                          >
                            {priority.label}
                          </Text>
                        </View>
                        {formData.priority === priority.value && (
                          <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Deadline Picker Overlay */}
            {showDeadlinePicker && (
              <View style={styles.pickerOverlay}>
                <TouchableOpacity
                  style={styles.pickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowDeadlinePicker(false)}
                />
                <View style={[styles.pickerModal, { backgroundColor: colors.cardBg }]}>
                  <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.text }]}>Chọn Hạn Chốt</Text>
                    <TouchableOpacity 
                      onPress={() => setShowDeadlinePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerCloseButton, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <View style={styles.dateInputRow}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                        value={formData.deadline}
                        onChangeText={(text) => setFormData({ ...formData, deadline: text })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.quickDateButtons}>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const oneMonth = new Date();
                          oneMonth.setMonth(oneMonth.getMonth() + 1);
                          setFormData({ ...formData, deadline: oneMonth.toISOString().split('T')[0] });
                          setShowDeadlinePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>1 tháng</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const threeMonths = new Date();
                          threeMonths.setMonth(threeMonths.getMonth() + 3);
                          setFormData({ ...formData, deadline: threeMonths.toISOString().split('T')[0] });
                          setShowDeadlinePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>3 tháng</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.quickDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                        onPress={() => {
                          const oneYear = new Date();
                          oneYear.setFullYear(oneYear.getFullYear() + 1);
                          setFormData({ ...formData, deadline: oneYear.toISOString().split('T')[0] });
                          setShowDeadlinePicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickDateButtonText, { color: colors.primary }]}>1 năm</Text>
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
  },
  loadingText: {
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
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  deadline: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  prioritySelectorText: {
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

export default GoalsScreen;
