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
    <div className="ai-chat-page">
      <h1 className="page-title">🤖 AI Financial Assistant</h1>

      <Card className="chat-card">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <h2>👋 Hello!</h2>
              <p>I'm your AI financial assistant. Ask me anything about:</p>
              <ul>
                <li>💰 Budgeting advice</li>
                <li>📊 Spending analysis</li>
                <li>💡 Savings tips</li>
                <li>📈 Financial planning</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">Thinking...</div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your finances..."
            rows={3}
          />
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AIChat;
