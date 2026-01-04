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

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Tổng Quan</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.card, styles.incomeCard]}>
          <Text style={styles.cardIcon}>💵</Text>
          <Text style={styles.cardLabel}>Tổng Thu Nhập</Text>
          <Text style={[styles.cardValue, styles.incomeValue]}>
            {formatCurrency(summary?.totalIncome || 0)}
          </Text>
        </View>

        <View style={[styles.card, styles.expenseCard]}>
          <Text style={styles.cardIcon}>💸</Text>
          <Text style={styles.cardLabel}>Tổng Chi Tiêu</Text>
          <Text style={[styles.cardValue, styles.expenseValue]}>
            {formatCurrency(summary?.totalExpense || 0)}
          </Text>
        </View>

        <View style={[styles.card, styles.savingsCard]}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardLabel}>Tiết Kiệm Ròng</Text>
          <Text
            style={[
              styles.cardValue,
              (summary?.netSavings || 0) >= 0 ? styles.savingsPositive : styles.savingsNegative,
            ]}
          >
            {formatCurrency(summary?.netSavings || 0)}
          </Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Giao Dịch Gần Đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions && recentTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {recentTransactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  transaction.type === 'income'
                    ? styles.transactionIncome
                    : styles.transactionExpense,
                ]}
              >
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Không có mô tả'}
                  </Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'income'
                      ? styles.transactionAmountIncome
                      : styles.transactionAmountExpense,
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phân Loại Chi Tiêu</Text>
        {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
          <View style={styles.categoryList}>
            {summary.categoryBreakdown
              .filter((cat) => cat.total > 0)
              .slice(0, 6)
              .map((cat, index) => (
                <View key={index} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text
                    style={[
                      styles.categoryAmount,
                      cat.type === 'expense' ? styles.expenseValue : styles.incomeValue,
                    ]}
                  >
                    {formatCurrency(cat.total)}
                  </Text>
                </View>
              ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Chưa có dữ liệu phân loại</Text>
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
