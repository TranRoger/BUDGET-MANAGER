import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';
import { Transaction, Budget } from '../types';
import { formatCurrency } from '../utils/format';
import { COLORS } from '../constants/theme';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsData, budgetsData] = await Promise.all([
        transactionService.getAll(),
        budgetService.getAll(),
      ]);
      setTransactions(transactionsData.slice(0, 5)); // Latest 5 transactions
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  };

  const { income, expense, balance } = calculateTotals();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} testID="loading-indicator" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-blue-500 p-6 pb-8">
        <Text className="text-white text-xl font-bold mb-1">Xin chào, {user?.name}!</Text>
        <Text className="text-blue-100 text-sm">Chào mừng bạn trở lại</Text>
      </View>

      {/* Balance Cards */}
      <View className="px-4 -mt-4">
        <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
          <Text className="text-gray-600 text-sm mb-2">Số dư hiện tại</Text>
          <Text className="text-3xl font-bold text-gray-900">{formatCurrency(balance)}</Text>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-green-50 rounded-xl p-4 border border-green-100">
            <Text className="text-green-600 text-xs font-semibold mb-1">THU NHẬP</Text>
            <Text className="text-green-700 text-lg font-bold">{formatCurrency(income)}</Text>
          </View>
          <View className="flex-1 bg-red-50 rounded-xl p-4 border border-red-100">
            <Text className="text-red-600 text-xs font-semibold mb-1">CHI TIÊU</Text>
            <Text className="text-red-700 text-lg font-bold">{formatCurrency(expense)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 mb-4">
        <Text className="text-gray-900 font-bold text-lg mb-3">Truy cập nhanh</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm"
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text className="text-3xl mb-2">💰</Text>
            <Text className="text-gray-700 font-medium text-sm">Giao dịch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm"
            onPress={() => navigation.navigate('Budgets')}
          >
            <Text className="text-3xl mb-2">📊</Text>
            <Text className="text-gray-700 font-medium text-sm">Ngân sách</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm"
            onPress={() => navigation.navigate('AIChat')}
          >
            <Text className="text-3xl mb-2">🤖</Text>
            <Text className="text-gray-700 font-medium text-sm">AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View className="px-4 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-900 font-bold text-lg">Giao dịch gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text className="text-blue-500 text-sm font-medium">Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-white rounded-xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-gray-400 text-sm">Chưa có giao dịch nào</Text>
            </View>
          ) : (
            transactions.map((transaction, index) => (
              <View
                key={transaction.id}
                className={`flex-row items-center p-4 ${
                  index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Text className="text-lg">{transaction.type === 'income' ? '📥' : '📤'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">{transaction.category_name}</Text>
                  <Text className="text-gray-500 text-xs">{transaction.description || 'Không có mô tả'}</Text>
                </View>
                <Text
                  className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
