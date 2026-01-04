import React, { useState, useEffect } from 'react';
import Card from '../components/Card';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Cài Đặt</h1>
        <p className="text-gray-600">Cấu hình Google AI cho tính năng thông minh</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">🤖 Google AI Configuration</h2>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
            >
              🔑 Lấy API Key miễn phí
            </a>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="aiApiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="aiApiKey"
                type={showApiKey ? 'text' : 'password'}
                value={settings.aiApiKey}
                onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Nhập Google AI API Key của bạn. API key được lưu trữ an toàn và chỉ bạn mới truy cập được.
            </p>
          </div>

          <div>
            <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              id="aiModel"
              value={settings.aiModel}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Chọn model phù hợp với nhu cầu. Flash nhanh hơn, Pro chất lượng cao hơn.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 So Sánh Models</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Model</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Tốc Độ</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Chất Lượng</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-700">Phù Hợp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">Gemini 2.5 Flash</td>
                    <td className="py-3 px-4 text-sm">⚡⚡⚡</td>
                    <td className="py-3 px-4 text-sm">⭐⭐⭐⭐</td>
                    <td className="py-3 px-4 text-sm text-gray-600">Nhanh, ổn định, phù hợp mọi tác vụ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-900">Gemini 3.0 Flash</td>
                    <td className="py-3 px-4 text-sm">⚡⚡⚡</td>
                    <td className="py-3 px-4 text-sm">⭐⭐⭐⭐⭐</td>
                    <td className="py-3 px-4 text-sm text-gray-600">Model mới nhất, hiệu năng cao nhất</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !settings.aiApiKey.trim()}
            >
              {saving ? '🔄 Đang kiểm tra...' : '🧪 Test Connection'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? '💾 Đang lưu...' : '💾 Lưu Cài Đặt'}
            </button>
          </div>
        </form>
      </Card>

      <Card className="mt-8 bg-blue-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">ℹ️ Hướng Dẫn</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Lấy API Key</h3>
              <p className="text-gray-600 text-sm">
                Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google AI Studio</a> và tạo API key miễn phí
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Nhập API Key</h3>
              <p className="text-gray-600 text-sm">Dán API key vào form trên và chọn model phù hợp</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Test & Lưu</h3>
              <p className="text-gray-600 text-sm">Nhấn "Test Connection" để kiểm tra, sau đó "Lưu Cài Đặt"</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Sử Dụng AI</h3>
              <p className="text-gray-600 text-sm">Tính năng AI Insights và Spending Plans sẽ sử dụng API key của bạn</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
