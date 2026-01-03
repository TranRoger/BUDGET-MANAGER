import React, { useState, useRef, useEffect } from 'react';
import { aiService, ChatMessage } from '../services/aiService';
import './ChatBubble.css';

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
        className={`chat-bubble-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      <div className={`chat-bubble-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-bubble-header">
          <div className="chat-header-info">
            <div className="chat-avatar">🤖</div>
            <div>
              <h3 className="chat-title">AI Assistant</h3>
              <span className="chat-status">● Online</span>
            </div>
          </div>
          <button
            className="chat-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="chat-bubble-messages">
          {messages.length === 0 ? (
            <div className="chat-bubble-welcome">
              <div className="welcome-icon">👋</div>
              <h4>Hello! I'm your AI financial assistant</h4>
              <p>I can help you manage your finances:</p>
              <div className="welcome-tags">
                <span className="welcome-tag">💵 Track spending</span>
                <span className="welcome-tag">🎯 Set goals</span>
                <span className="welcome-tag">💳 Manage debts</span>
                <span className="welcome-tag">📊 Get insights</span>
              </div>
              <div className="welcome-examples">
                <p className="examples-title">Try saying:</p>
                <div className="example-item">"I spent $50 on groceries today"</div>
                <div className="example-item">"I want to save $5000 for vacation"</div>
                <div className="example-item">"I have a car loan of $15000"</div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`bubble-message ${msg.role}`}>
                  <div className="bubble-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="bubble-content">
                    <div className="bubble-text">{msg.content}</div>
                    <div className="bubble-time">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="bubble-message assistant">
                  <div className="bubble-avatar">🤖</div>
                  <div className="bubble-content">
                    <div className="bubble-text typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="chat-bubble-input">
          <textarea
            className="bubble-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            disabled={loading}
          />
          <button
            className="bubble-send-btn"
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
