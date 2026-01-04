import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const FinanceMenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const menuItems = [
    {
      id: 'transactions',
      title: 'Giao Dịch',
      icon: '💳',
      description: 'Quản lý thu chi hàng ngày',
      color: '#3b82f6',
      screen: 'Transactions',
    },
    {
      id: 'budgets',
      title: 'Ngân Sách',
      icon: '💰',
      description: 'Lập kế hoạch ngân sách',
      color: '#10b981',
      screen: 'Budgets',
    },
    {
      id: 'debts',
      title: 'Quản Lý Nợ',
      icon: '💸',
      description: 'Theo dõi các khoản nợ',
      color: '#ef4444',
      screen: 'Debts',
    },
    {
      id: 'spending-limits',
      title: 'Giới Hạn Chi Tiêu',
      icon: '🚨',
      description: 'Đặt giới hạn cho từng danh mục',
      color: '#f59e0b',
      screen: 'SpendingLimits',
    },
    {
      id: 'goals',
      title: 'Mục Tiêu',
      icon: '🎯',
      description: 'Mục tiêu tài chính cá nhân',
      color: '#8b5cf6',
      screen: 'Goals',
    },
    {
      id: 'categories',
      title: 'Danh Mục',
      icon: '📁',
      description: 'Quản lý danh mục thu chi',
      color: '#06b6d4',
      screen: 'Categories',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💼 Quản Lý Tài Chính</Text>
        <Text style={styles.subtitle}>Chọn chức năng bạn muốn sử dụng</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuCard, { borderLeftColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 32,
    color: '#d1d5db',
    fontWeight: 'bold',
  },
});

export default FinanceMenuScreen;
