import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { budgetService } from '../services/budgetService';
import { Budget } from '../types';
import { formatCurrency } from '../utils/format';
import { COLORS } from '../constants/theme';

const BudgetsScreen: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const data = await budgetService.getAll();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
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
      <View className="p-4">
        {budgets.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-gray-400 text-sm">Chưa có ngân sách nào</Text>
          </View>
        ) : (
          budgets.map((budget) => (
            <View key={budget.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-900 font-semibold text-base">
                  {budget.category_name}
                </Text>
                <Text className="text-gray-500 text-xs capitalize">{budget.period}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-600 font-bold text-lg">
                  {formatCurrency(Number(budget.amount))}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default BudgetsScreen;
