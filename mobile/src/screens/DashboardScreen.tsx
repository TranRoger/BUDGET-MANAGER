import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { reportService, FinancialSummary } from '../services/reportService';
import { transactionService, Transaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [summaryData, transactionsData] = await Promise.all([
        reportService.getSummary(startDate, endDate),
        transactionService.getAll({ limit: 5 }),
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Tổng Quan</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.card, { backgroundColor: colors.successLight }]}>
          <Text style={styles.cardIcon}>💵</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Tổng Thu Nhập</Text>
          <Text style={[styles.cardValue, { color: colors.success }]}>
            {formatCurrency(summary?.totalIncome || 0)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.dangerLight }]}>
          <Text style={styles.cardIcon}>💸</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Tổng Chi Tiêu</Text>
          <Text style={[styles.cardValue, { color: colors.danger }]}>
            {formatCurrency(summary?.totalExpense || 0)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Tiết Kiệm Ròng</Text>
          <Text
            style={[
              styles.cardValue,
              { color: (summary?.netSavings || 0) >= 0 ? colors.success : colors.danger },
            ]}
          >
            {formatCurrency(summary?.netSavings || 0)}
          </Text>
        </View>
      </View>

      {/* AI Spending Plan Button */}
      <TouchableOpacity
        style={[styles.aiPlanButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        onPress={() => navigation.navigate('AISpendingPlan')}
      >
        <Text style={styles.aiPlanIcon}>🤖</Text>
        <View style={styles.aiPlanContent}>
          <Text style={[styles.aiPlanTitle, { color: colors.text }]}>Kế Hoạch Chi Tiêu AI</Text>
          <Text style={[styles.aiPlanSubtitle, { color: colors.textSecondary }]}>Tạo kế hoạch tài chính thông minh →</Text>
        </View>
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Giao Dịch Gần Đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions && recentTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {recentTransactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                  transaction.type === 'income'
                    ? { borderLeftColor: colors.success, backgroundColor: colors.successLight }
                    : { borderLeftColor: colors.danger, backgroundColor: colors.dangerLight },
                ]}
              >
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.text }]}>
                    {transaction.description || 'Không có mô tả'}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDate(transaction.date)}</Text>
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
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có giao dịch nào</Text>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Phân Loại Chi Tiêu</Text>
        {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
          <View style={styles.categoryList}>
        {summary.categoryBreakdown
          .filter((cat) => cat.total > 0)
          .slice(0, 6)
          .map((cat, index) => (
            <View key={cat.name + index} style={[styles.categoryItem, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
          <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
          <Text
            style={[
              styles.categoryAmount,
              { color: cat.type === 'expense' ? colors.danger : colors.success },
            ]}
          >
            {formatCurrency(cat.total)}
          </Text>
            </View>
          ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chưa có dữ liệu phân loại</Text>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: '#f3f4f6',
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryGrid: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeCard: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expenseCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  savingsCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  incomeValue: {
    color: '#10b981',
  },
  expenseValue: {
    color: '#ef4444',
  },
  savingsPositive: {
    color: '#3b82f6',
  },
  savingsNegative: {
    color: '#f97316',
  },
  aiPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiPlanIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  aiPlanContent: {
    flex: 1,
  },
  aiPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  aiPlanSubtitle: {
    fontSize: 14,
    color: '#1e40af',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  transactionIncome: {
    backgroundColor: '#ecfdf5',
    borderLeftColor: '#10b981',
  },
  transactionExpense: {
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
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionAmountIncome: {
    color: '#10b981',
  },
  transactionAmountExpense: {
    color: '#ef4444',
  },
  categoryList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 32,
  },
});

export default DashboardScreen;
