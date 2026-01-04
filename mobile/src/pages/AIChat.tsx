import React, { useState } from 'react';
import { aiService, ChatMessage } from '../services/aiService';
import Card from '../components/Card';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(input, messages);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">🤖 AI Financial Assistant</h1>

      <Card className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👋 Hello!</h2>
              <p className="text-gray-600 mb-6">I'm your AI financial assistant. Ask me anything about:</p>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-center gap-2 text-gray-700">
                  <span>💰</span> Budgeting advice
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span>📊</span> Spending analysis
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span>💡</span> Savings tips
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span>📈</span> Financial planning
                </li>
              </ul>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-3 max-w-3xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600">
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <textarea
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your finances..."
              rows={3}
            />
            <button
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIChat;
