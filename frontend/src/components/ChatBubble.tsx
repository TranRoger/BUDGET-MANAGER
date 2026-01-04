import React, { useState, useRef, useEffect } from 'react';
import { aiService, ChatMessage } from '../services/aiService';

const ChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(input, messages);
      
      let content = response.message;
      
      // If AI performed actions, add notification
      if (response.functionCalls && response.functionCalls.length > 0) {
        const actions = response.functionCalls.map((fc: any) => {
          const { name, args } = fc.functionCall;
          if (name === 'add_transaction') {
            return `✅ Added ${args.type}: $${args.amount} - ${args.description}`;
          } else if (name === 'add_debt') {
            return `✅ Added debt: ${args.name} - $${args.amount}`;
          } else if (name === 'add_goal') {
            return `✅ Created goal: ${args.name} - Target: $${args.target_amount}`;
          }
          return '';
        }).filter(Boolean);
        
        if (actions.length > 0) {
          content = actions.join('\n') + '\n\n' + content;
        }
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: content,
      };
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages([...messages, userMessage, errorMessage]);
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
    <>
      {/* Chat Bubble Button */}
      <button
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center text-2xl z-50 ${isOpen ? 'rotate-90' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl transform transition-all duration-300 z-40 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'} flex flex-col`}>
        <div className="bg-primary-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">🤖</div>
            <div>
              <h3 className="font-bold text-lg">AI Assistant</h3>
              <span className="text-xs text-green-200 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
          <button
            className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors duration-200 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-6 px-4">
              <div className="text-6xl mb-4">👋</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Hello! I'm your AI financial assistant</h4>
              <p className="text-gray-600 mb-4">I can help you manage your finances:</p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">💵 Track spending</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">🎯 Set goals</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">💳 Manage debts</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">📊 Get insights</span>
              </div>
              <div className="bg-white rounded-xl p-4 text-left shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3">Try saying:</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">"I spent $50 on groceries today"</div>
                  <div className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">"I want to save $5000 for vacation"</div>
                  <div className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">"I have a car loan of $15000"</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="flex flex-col">
                      <div className={`px-4 py-2 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-br-sm' 
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}>
                        <div className="whitespace-pre-wrap break-words text-sm">{msg.content}</div>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg">🤖</div>
                    <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl flex gap-2">
          <textarea
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={loading}
          />
          <button
            className="w-12 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 shadow-lg hover:shadow-xl"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBubble;
