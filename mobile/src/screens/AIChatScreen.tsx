import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { aiService } from '../services/aiService';
import { AIMessage } from '../types';
import { COLORS } from '../constants/theme';

const AIChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiService.chat(userMessage.content, messages);
      
      if (response.success && response.data?.response) {
        const assistantMessage: AIMessage = {
          role: 'assistant',
          content: response.data.response,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-6xl mb-4">🤖</Text>
            <Text className="text-gray-900 text-xl font-bold mb-2">Trợ Lý AI Tài Chính</Text>
            <Text className="text-gray-500 text-center px-8">
              Hỏi tôi về tài chính của bạn, kế hoạch chi tiêu, hoặc bất kỳ điều gì!
            </Text>
          </View>
        ) : (
          messages.map((message, index) => (
            <View
              key={index}
              className={`mb-3 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <Text
                  className={`${
                    message.role === 'user' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))
        )}
        {loading && (
          <View className="items-start mb-3">
            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className="bg-white border-t border-gray-200 p-3">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-2 text-gray-900"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            maxLength={500}
          />
          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputText.trim() && !loading ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Text className="text-white text-lg">➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AIChatScreen;
