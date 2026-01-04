import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { COLORS } from '../constants/theme';

const SettingsScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(user?.ai_model || 'gemini-2.0-flash-exp');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const models = [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Nhanh nhất)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Cân bằng)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Chất lượng cao)' },
  ];

  const testAPIKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập API key');
      return;
    }

    setTesting(true);
    try {
      const response = await authService.testAIKey(apiKey);
      if (response.success) {
        Alert.alert('Thành công', 'API key hợp lệ!');
      } else {
        Alert.alert('Lỗi', response.message || 'API key không hợp lệ');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể kiểm tra API key');
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập API key');
      return;
    }

    setSaving(true);
    try {
      const response = await authService.updateSettings({
        ai_api_key: apiKey,
        ai_model: model,
      });

      if (response.success) {
        Alert.alert('Thành công', 'Cài đặt đã được lưu');
        if (user) {
          updateUser({ ...user, ai_api_key: apiKey, ai_model: model });
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* User Info */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-gray-600 text-sm mb-1">Người dùng</Text>
          <Text className="text-gray-900 font-bold text-lg">{user?.name}</Text>
          <Text className="text-gray-500 text-sm">{user?.email}</Text>
        </View>

        {/* AI Settings */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-gray-900 font-bold text-lg mb-4">Cài Đặt AI</Text>

          {/* API Key */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Google AI API Key</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-gray-900 mb-2"
              placeholder="AIzaSy..."
              placeholderTextColor="#9ca3af"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={true}
            />
            <TouchableOpacity
              className={`rounded-lg py-3 items-center ${
                testing ? 'bg-gray-300' : 'bg-blue-500'
              }`}
              onPress={testAPIKey}
              disabled={testing === true}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-medium">Kiểm Tra Kết Nối</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Model Selection */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">AI Model</Text>
            {models.map((m) => (
              <TouchableOpacity
                key={m.value}
                className={`border rounded-lg p-3 mb-2 ${
                  model === m.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                onPress={() => setModel(m.value)}
              >
                <Text
                  className={`${
                    model === m.value ? 'text-blue-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${
              saving ? 'bg-gray-300' : 'bg-green-500'
            }`}
            onPress={saveSettings}
            disabled={saving === true}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">Lưu Cài Đặt</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <Text className="text-blue-900 font-semibold mb-2">ℹ️ Hướng dẫn</Text>
          <Text className="text-blue-800 text-sm leading-5">
            Truy cập{' '}
            <Text className="font-bold">https://aistudio.google.com/app/apikey</Text>
            {' '}để tạo API key miễn phí. Mỗi người dùng có quota riêng.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;
