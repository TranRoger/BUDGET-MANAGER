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
} from 'react-native';
import { debtService, Debt, CreateDebtData, DebtTransaction } from '../services/debtService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const DebtsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null);
  const [debtTransactions, setDebtTransactions] = useState<{ [key: number]: DebtTransaction[] }>({});
  const [showTransactionForm, setShowTransactionForm] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<CreateDebtData>({
    name: '',
    amount: 0,
    interest_rate: undefined,
    due_date: '',
    description: '',
  });

  const [transactionFormData, setTransactionFormData] = useState({
    amount: '',
    type: 'payment' as 'payment' | 'increase',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [debtsData, statsData] = await Promise.all([
        debtService.getAll(),
        debtService.getStats()
      ]);
      setDebts(debtsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebtTransactions = async (debtId: number) => {
    try {
      const transactions = await debtService.getTransactions(debtId);
      setDebtTransactions(prev => ({ ...prev, [debtId]: transactions }));
    } catch (error) {
      console.error('Failed to fetch debt transactions:', error);
    }
  };

  const toggleExpand = (debtId: number) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
    } else {
      setExpandedDebtId(debtId);
      if (!debtTransactions[debtId]) {
        fetchDebtTransactions(debtId);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingDebt) {
        await debtService.update(editingDebt.id, formData);
      } else {
        await debtService.create(formData);
      }
      setShowForm(false);
      setEditingDebt(null);
      resetForm();
      fetchData();
      Alert.alert('Thành công', editingDebt ? 'Đã cập nhật khoản nợ' : 'Đã thêm khoản nợ mới');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu khoản nợ');
    }
  };

  const handleTransactionSubmit = async (debtId: number) => {
    if (!transactionFormData.amount || Number(transactionFormData.amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      await debtService.addTransaction(debtId, {
        amount: Number(transactionFormData.amount),
        type: transactionFormData.type,
        description: transactionFormData.description,
        date: transactionFormData.date,
      });
      setShowTransactionForm(null);
      resetTransactionForm();
      fetchData();
      fetchDebtTransactions(debtId);
      Alert.alert('Thành công', 'Đã thêm giao dịch');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm giao dịch');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa khoản nợ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await debtService.delete(id);
              fetchData();
              Alert.alert('Thành công', 'Đã xóa khoản nợ');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa khoản nợ');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      interest_rate: undefined,
      due_date: '',
      description: '',
    });
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      amount: '',
      type: 'payment',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const openEditForm = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      amount: debt.amount,
      interest_rate: debt.interest_rate,
      due_date: debt.due_date || '',
      description: debt.description || '',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
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
        <Text style={[styles.title, { color: colors.text }]}>💸 Quản Lý Nợ</Text>
        <TouchableOpacity onPress={() => { resetForm(); setEditingDebt(null); setShowForm(true); }}>
          <Text style={[styles.addButton, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng Khoản Nợ</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.total_debts}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng Số Tiền</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {formatCurrency(stats.total_amount)}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        {debts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>💸</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có khoản nợ nào</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => { resetForm(); setShowForm(true); }}
            >
              <Text style={styles.emptyButtonText}>Thêm Khoản Nợ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          debts.map((debt) => (
            <View key={debt.id} style={[styles.debtCard, { backgroundColor: colors.cardBg }]}>
              <TouchableOpacity onPress={() => toggleExpand(debt.id)}>
                <View style={styles.debtHeader}>
                  <View style={styles.debtInfo}>
                    <Text style={[styles.debtName, { color: colors.text }]}>{debt.name}</Text>
                    <Text style={[styles.debtAmount, { color: colors.danger }]}>{formatCurrency(debt.amount)}</Text>
                    {debt.remaining_amount !== undefined && (
                      <Text style={[styles.debtRemaining, { color: colors.textSecondary }]}>
                        Còn lại: {formatCurrency(debt.remaining_amount)}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>{expandedDebtId === debt.id ? '▼' : '▶'}</Text>
                </View>
              </TouchableOpacity>

              {expandedDebtId === debt.id && (
                <View style={[styles.debtDetails, { borderTopColor: colors.border }]}>
                  {debt.interest_rate && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Lãi suất: {debt.interest_rate}%</Text>
                  )}
                  {debt.due_date && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Hạn trả: {formatDate(debt.due_date)}</Text>
                  )}
                  {debt.description && (
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Ghi chú: {debt.description}</Text>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.success }]}
                      onPress={() => setShowTransactionForm(debt.id)}
                    >
                      <Text style={styles.actionButtonText}>Thanh Toán</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => openEditForm(debt)}
                    >
                      <Text style={styles.actionButtonText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.danger }]}
                      onPress={() => handleDelete(debt.id)}
                    >
                      <Text style={styles.actionButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Transactions */}
                  {debtTransactions[debt.id] && debtTransactions[debt.id].length > 0 && (
                    <View style={[styles.transactionsSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.transactionsTitle, { color: colors.text }]}>Lịch Sử Giao Dịch</Text>
                      {debtTransactions[debt.id].map((trans) => (
                        <View key={trans.id} style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
                          <View>
                            <Text style={[styles.transactionType, { color: colors.text }]}>
                              {trans.type === 'payment' ? '💰 Thanh toán' : '📈 Tăng nợ'}
                            </Text>
                            <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDate(trans.date)}</Text>
                          </View>
                          <Text
                            style={[
                              styles.transactionAmount,
                              trans.type === 'payment' ? { color: colors.success } : { color: colors.danger },
                            ]}
                          >
                            {trans.type === 'payment' ? '-' : '+'}
                            {formatCurrency(trans.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingDebt ? 'Sửa Khoản Nợ' : 'Thêm Khoản Nợ'}
            </Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Tên khoản nợ *"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Số tiền *"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={formData.amount?.toString()}
              onChangeText={(text) => setFormData({ ...formData, amount: Number(text) || 0 })}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Lãi suất (%)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={formData.interest_rate?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, interest_rate: Number(text) || undefined })}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Hạn trả (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Ghi chú"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardBg }]}
                onPress={() => { setShowForm(false); setEditingDebt(null); }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Form Modal */}
      <Modal visible={showTransactionForm !== null} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm Giao Dịch</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  transactionFormData.type === 'payment' && [styles.typeButtonActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }],
                ]}
                onPress={() => setTransactionFormData({ ...transactionFormData, type: 'payment' })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    transactionFormData.type === 'payment' && [styles.typeButtonTextActive, { color: colors.primary }],
                  ]}
                >
                  💰 Thanh Toán
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { borderColor: colors.border },
                  transactionFormData.type === 'increase' && [styles.typeButtonActive, { borderColor: colors.primary, backgroundColor: colors.primaryLight }],
                ]}
                onPress={() => setTransactionFormData({ ...transactionFormData, type: 'increase' })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.textSecondary },
                    transactionFormData.type === 'increase' && [styles.typeButtonTextActive, { color: colors.primary }],
                  ]}
                >
                  📈 Tăng Nợ
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Số tiền *"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={transactionFormData.amount}
              onChangeText={(text) => setTransactionFormData({ ...transactionFormData, amount: text })}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Ngày giao dịch"
              placeholderTextColor={colors.textSecondary}
              value={transactionFormData.date}
              onChangeText={(text) => setTransactionFormData({ ...transactionFormData, date: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
              placeholder="Ghi chú"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={transactionFormData.description}
              onChangeText={(text) => setTransactionFormData({ ...transactionFormData, description: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardBg }]}
                onPress={() => { setShowTransactionForm(null); resetTransactionForm(); }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={() => showTransactionForm && handleTransactionSubmit(showTransactionForm)}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
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
  addButton: {
    fontSize: 32,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debtCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  debtInfo: {
    flex: 1,
  },
  debtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 4,
  },
  debtRemaining: {
    fontSize: 14,
    color: '#6b7280',
  },
  expandIcon: {
    fontSize: 20,
    color: '#9ca3af',
  },
  debtDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionType: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#2563eb',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DebtsScreen;
