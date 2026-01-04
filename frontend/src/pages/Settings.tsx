import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import './Settings.css';

interface AISettings {
  aiApiKey: string;
  aiModel: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AISettings>({
    aiApiKey: '',
    aiModel: 'gemini-2.5-flash',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const availableModels = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash - Nhanh & ổn định' },
    { value: 'gemini-3-flash', label: 'Gemini 3.0 Flash - Mới nhất & mạnh nhất' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          aiApiKey: data.aiApiKey || '',
          aiModel: data.aiModel || 'gemini-2.0-flash-exp',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings.aiApiKey.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập API Key' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiApiKey: settings.aiApiKey,
          aiModel: settings.aiModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Đã lưu cài đặt thành công!' });
      } else {
        throw new Error(data.message || 'Không thể lưu cài đặt');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.aiApiKey.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập API Key trước khi test' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/test-ai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiApiKey: settings.aiApiKey,
          aiModel: settings.aiModel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ API Key hoạt động tốt!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'API Key không hợp lệ' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Không thể kết nối với Google AI' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Cài Đặt</h1>
        <p className="settings-subtitle">Cấu hình Google AI cho tính năng thông minh</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <Card className="settings-card">
        <div className="settings-section">
          <div className="section-header">
            <h2>🤖 Google AI Configuration</h2>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="get-key-link"
            >
              🔑 Lấy API Key miễn phí
            </a>
          </div>

          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label htmlFor="aiApiKey">
                API Key <span className="required">*</span>
              </label>
              <div className="api-key-input-wrapper">
                <input
                  id="aiApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.aiApiKey}
                  onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="api-key-input"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="toggle-visibility"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="help-text">
                Nhập Google AI API Key của bạn. API key được lưu trữ an toàn và chỉ bạn mới truy cập được.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="aiModel">
                Model <span className="required">*</span>
              </label>
              <select
                id="aiModel"
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="model-select"
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              <p className="help-text">
                Chọn model phù hợp với nhu cầu. Flash nhanh hơn, Pro chất lượng cao hơn.
              </p>
            </div>

            <div className="model-comparison">
              <h3>📊 So Sánh Models</h3>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Tốc Độ</th>
                    <th>Chất Lượng</th>
                    <th>Phù Hợp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gemini 2.5 Flash</td>
                    <td>⚡⚡⚡</td>
                    <td>⭐⭐⭐⭐</td>
                    <td>Nhanh, ổn định, phù hợp mọi tác vụ</td>
                  </tr>
                  <tr>
                    <td>Gemini 3.0 Flash</td>
                    <td>⚡⚡⚡</td>
                    <td>⭐⭐⭐⭐⭐</td>
                    <td>Model mới nhất, hiệu năng cao nhất</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleTestConnection}
                className="btn-test"
                disabled={saving || !settings.aiApiKey.trim()}
              >
                {saving ? '🔄 Đang kiểm tra...' : '🧪 Test Connection'}
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={saving}
              >
                {saving ? '💾 Đang lưu...' : '💾 Lưu Cài Đặt'}
              </button>
            </div>
          </form>
        </div>
      </Card>

      <Card className="settings-card info-card">
        <h2>ℹ️ Hướng Dẫn</h2>
        <div className="info-content">
          <div className="info-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Lấy API Key</h3>
              <p>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> và tạo API key miễn phí</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Nhập API Key</h3>
              <p>Dán API key vào form trên và chọn model phù hợp</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Test & Lưu</h3>
              <p>Nhấn "Test Connection" để kiểm tra, sau đó "Lưu Cài Đặt"</p>
            </div>
          </div>
          <div className="info-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Sử Dụng AI</h3>
              <p>Tính năng AI Insights và Spending Plans sẽ sử dụng API key của bạn</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
