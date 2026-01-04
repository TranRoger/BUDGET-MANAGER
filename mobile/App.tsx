import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FinanceMenuScreen from './src/screens/FinanceMenuScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import DebtsScreen from './src/screens/DebtsScreen';
import SpendingLimitsScreen from './src/screens/SpendingLimitsScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import AISpendingPlanScreen from './src/screens/AISpendingPlanScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#2563eb" />
    <Text style={styles.loadingText}>Đang tải...</Text>
  </View>
);

// Main Tab Navigator (after login)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Tổng Quan',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="FinanceMenu"
        component={FinanceMenuScreen}
        options={{
          tabBarLabel: 'Tài Chính',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💼</Text>,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Báo Cáo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🤖</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const authContext = useAuth();
  const isLoading = Boolean(authContext.loading);
  const isLoggedIn = Boolean(authContext.isAuthenticated);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="Budgets" component={BudgetsScreen} />
          <Stack.Screen name="Debts" component={DebtsScreen} />
          <Stack.Screen name="SpendingLimits" component={SpendingLimitsScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="AISpendingPlan" component={AISpendingPlanScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
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
});