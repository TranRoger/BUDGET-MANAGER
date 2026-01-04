import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View className="flex-1 bg-red-500 justify-center items-center">
          <Text className="text-white text-xl font-bold">Hello Roger</Text>
        </View>
        {/* <AppNavigator /> */}
        {/* <StatusBar style="auto" /> */}
      </AuthProvider>
    </SafeAreaProvider>
  );
}
