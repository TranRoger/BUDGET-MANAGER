import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { COLORS } from '../constants/theme';

const TransactionsScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      const filters = filter === 'all' ? {} : { type: filter };
      const data = await transactionService.getAll(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter Tabs */}
      <View className="flex-row bg-white p-2 shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg mx-1 ${filter === 'all' ? 'bg-blue-500' : 'bg-gray-100'}`}
          onPress={() => setFilter('all')}
        >
          <Text className={`text-center font-medium ${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg mx-1 ${filter === 'income' ? 'bg-green-500' : 'bg-gray-100'}`}
          onPress={() => setFilter('income')}
        >
          <Text className={`text-center font-medium ${filter === 'income' ? 'text-white' : 'text-gray-600'}`}>
            Thu nhập
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg mx-1 ${filter === 'expense' ? 'bg-red-500' : 'bg-gray-100'}`}
          onPress={() => setFilter('expense')}
        >
          <Text className={`text-center font-medium ${filter === 'expense' ? 'text-white' : 'text-gray-600'}`}>
            Chi tiêu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {transactions.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-gray-400 text-sm">Không có giao dịch nào</Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {transactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={`flex-row items-center p-4 ${
                    index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Text className="text-xl">{transaction.type === 'income' ? '📥' : '📤'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{transaction.category_name}</Text>
                    <Text className="text-gray-500 text-xs">{transaction.description || 'Không có mô tả'}</Text>
                    <Text className="text-gray-400 text-xs mt-1">{formatDate(transaction.date)}</Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`font-bold text-base ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TransactionsScreen;
