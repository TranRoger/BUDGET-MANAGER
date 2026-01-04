import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { reportService, FinancialSummary, SpendingTrend, BudgetPerformance } from '../services/reportService';
import { formatCurrency } from '../utils/formatters';

const ReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trends, setTrends] = useState<SpendingTrend[]>([]);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [summaryData, trendsData, budgetData] = await Promise.all([
        reportService.getSummary(dateRange.startDate, dateRange.endDate),
        reportService.getTrends(dateRange.startDate, dateRange.endDate, 'month'),
        reportService.getBudgetPerformance(),
      ]);
      setSummary(summaryData);
      setTrends(trendsData);
      setBudgetPerformance(budgetData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    
    switch (preset) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  const processedTrends = () => {
    const periods = Array.from(new Set(trends.map(t => t.period))).sort();
    return periods.map(period => {
      const income = trends.find(t => t.period === period && t.type === 'income')?.total || 0;
      const expense = trends.find(t => t.period === period && t.type === 'expense')?.total || 0;
      return { period, income: Number(income), expense: Number(expense) };
    });
  };

  const expenseCategories = summary?.categoryBreakdown
    .filter(c => c.type === 'expense' && Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total)) || [];

  const totalCategoryExpense = expenseCategories.reduce((sum, c) => sum + Number(c.total), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Báo Cáo & Phân Tích</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Date Filter */}
        <View style={styles.filterCard}>
          <View style={styles.presetButtons}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => setPresetRange('week')}
            >
              <Text style={styles.presetButtonText}>7 ngày</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => setPresetRange('month')}
            >
              <Text style={styles.presetButtonText}>Tháng này</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => setPresetRange('3months')}
            >
              <Text style={styles.presetButtonText}>3 tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => setPresetRange('year')}
            >
              <Text style={styles.presetButtonText}>Năm nay</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputs}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Từ ngày</Text>
              <TextInput
                style={styles.dateInput}
                value={dateRange.startDate}
                onChangeText={(text) => setDateRange({ ...dateRange, startDate: text })}
              />
            </View>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Đến ngày</Text>
              <TextInput
                style={styles.dateInput}
                value={dateRange.endDate}
                onChangeText={(text) => setDateRange({ ...dateRange, endDate: text })}
              />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.summaryIcon}>📥</Text>
                <Text style={styles.summaryLabel}>Tổng Thu Nhập</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  {formatCurrency(summary?.totalIncome || 0)}
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.summaryIcon}>📤</Text>
                <Text style={styles.summaryLabel}>Tổng Chi Tiêu</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  {formatCurrency(summary?.totalExpense || 0)}
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.summaryIcon}>💰</Text>
                <Text style={styles.summaryLabel}>Tiết Kiệm Ròng</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: (summary?.netSavings || 0) >= 0 ? '#3b82f6' : '#ef4444' },
                  ]}
                >
                  {formatCurrency(summary?.netSavings || 0)}
                </Text>
              </View>
            </View>

            {/* Spending Trends */}
            {processedTrends().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Xu Hướng Chi Tiêu</Text>
                <View style={styles.trendsCard}>
                  {processedTrends().map((trend, index) => (
                    <View key={index} style={styles.trendItem}>
                      <Text style={styles.trendPeriod}>{trend.period}</Text>
                      <View style={styles.trendBars}>
                        <View style={styles.trendRow}>
                          <Text style={styles.trendLabel}>Thu</Text>
                          <View style={styles.trendBarContainer}>
                            <View
                              style={[
                                styles.trendBar,
                                { width: `${Math.min(100, (trend.income / Math.max(trend.income, trend.expense)) * 100)}%`, backgroundColor: '#10b981' },
                              ]}
                            />
                          </View>
                          <Text style={styles.trendValue}>{formatCurrency(trend.income)}</Text>
                        </View>
                        <View style={styles.trendRow}>
                          <Text style={styles.trendLabel}>Chi</Text>
                          <View style={styles.trendBarContainer}>
                            <View
                              style={[
                                styles.trendBar,
                                { width: `${Math.min(100, (trend.expense / Math.max(trend.income, trend.expense)) * 100)}%`, backgroundColor: '#ef4444' },
                              ]}
                            />
                          </View>
                          <Text style={styles.trendValue}>{formatCurrency(trend.expense)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Category Breakdown */}
            {expenseCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏷️ Chi Tiêu Theo Danh Mục</Text>
                <View style={styles.categoryCard}>
                  {expenseCategories.map((category, index) => {
                    const percentage = (Number(category.total) / totalCategoryExpense) * 100;
                    return (
                      <View key={index} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryAmount}>
                            {formatCurrency(Number(category.total))}
                          </Text>
                        </View>
                        <View style={styles.categoryBarContainer}>
                          <View
                            style={[
                              styles.categoryBar,
                              { width: `${percentage}%`, backgroundColor: '#3b82f6' },
                            ]}
                          />
                        </View>
                        <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Budget Performance */}
            {budgetPerformance.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Hiệu Suất Ngân Sách</Text>
                <View style={styles.budgetCard}>
                  {budgetPerformance.map((budget) => {
                    const percentage = budget.percentage;
                    const statusColor = percentage >= 90 ? '#ef4444' : percentage >= 70 ? '#f59e0b' : '#10b981';
                    
                    return (
                      <View key={budget.id} style={styles.budgetItem}>
                        <View style={styles.budgetHeader}>
                          <Text style={styles.budgetCategory}>{budget.category_name}</Text>
                          <Text style={styles.budgetAmount}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}
                          </Text>
                        </View>
                        <View style={styles.budgetBarContainer}>
                          <View
                            style={[
                              styles.budgetBar,
                              { width: `${Math.min(percentage, 100)}%`, backgroundColor: statusColor },
                            ]}
                          />
                        </View>
                        <Text style={[styles.budgetPercentage, { color: statusColor }]}>
                          {percentage.toFixed(1)}% đã sử dụng
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  filterCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  summaryCards: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  trendsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendItem: {
    marginBottom: 20,
  },
  trendPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  trendBars: {
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 30,
  },
  trendBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 12,
    color: '#6b7280',
    width: 100,
    textAlign: 'right',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  categoryBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  budgetBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  budgetBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default ReportsScreen;
