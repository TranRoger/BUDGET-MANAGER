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
import { goalService, FinancialGoal, CreateGoalData } from '../services/goalService';
import { formatCurrency, formatDate } from '../utils/formatters';

const GoalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mục Tiêu</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
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
                style={styles.goalCard}
                onPress={() => handleEdit(goal)}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                    <Text style={styles.priorityText}>
                      {goal.priority === 'high' ? 'Cao' : goal.priority === 'medium' ? 'TB' : 'Thấp'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.goalStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Đã Tiết Kiệm</Text>
                    <Text style={styles.statValue}>{formatCurrency(goal.current_amount)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Mục Tiêu</Text>
                    <Text style={styles.statValue}>{formatCurrency(goal.target_amount)}</Text>
                  </View>
                </View>

                {goal.deadline && (
                  <Text style={styles.deadline}>📅 Hạn: {formatDate(goal.deadline)}</Text>
                )}

                {goal.description && (
                  <Text style={styles.description}>{goal.description}</Text>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(goal.id);
                  }}
                >
                  <Text style={styles.deleteText}>🗑️ Xóa</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Chưa có mục tiêu nào</Text>
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Sửa Mục Tiêu' : 'Thêm Mục Tiêu'}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên Mục Tiêu *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Ví dụ: Mua nhà, Du lịch..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số Tiền Mục Tiêu *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.target_amount.toString()}
                  onChangeText={(text) => setFormData({ ...formData, target_amount: Number(text) || 0 })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số Tiền Hiện Tại</Text>
                <TextInput
                  style={styles.input}
                  value={formData.current_amount?.toString() || '0'}
                  onChangeText={(text) => setFormData({ ...formData, current_amount: Number(text) || 0 })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mức Độ Ưu Tiên</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Cao" value="high" />
                    <Picker.Item label="Trung Bình" value="medium" />
                    <Picker.Item label="Thấp" value="low" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hạn Chót</Text>
                <TextInput
                  style={styles.input}
                  value={formData.deadline}
                  onChangeText={(text) => setFormData({ ...formData, deadline: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô Tả</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Mô tả mục tiêu..."
                  multiline
                  numberOfLines={4}
                />
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
                      {editingGoal ? 'Cập Nhật' : 'Thêm'}
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

export default GoalsScreen;
