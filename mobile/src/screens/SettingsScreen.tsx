import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Nhanh & ổn định', speed: '⚡⚡⚡', quality: '⭐⭐⭐⭐' },
  { id: 'gemini-3-flash', name: 'Gemini 3.0 Flash', description: 'Mới nhất & mạnh nhất', speed: '⚡⚡⚡', quality: '⭐⭐⭐⭐⭐' },
];

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/settings');
      if (response.data) {
        setApiKey(response.data.aiApiKey || '');
        setSelectedModel(response.data.aiModel || 'gemini-2.5-flash');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập API Key');
      return;
    }

    try {
      setSaving(true);
      await api.put('/auth/settings', {
        aiApiKey: apiKey,
        aiModel: selectedModel,
      });
      Alert.alert('Thành công', 'Đã lưu cài đặt thành công!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập API Key trước khi test');
      return;
    }

    try {
      setTesting(true);
      await api.post('/auth/test-ai-key', {
        aiApiKey: apiKey,
        aiModel: selectedModel,
      });
      Alert.alert('Thành công', '✅ API Key hoạt động tốt!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'API Key không hợp lệ');
    } finally {
      setTesting(false);
    }
  };

  const openGoogleAIStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận không khớp');
      return;
    }

    try {
      setChangingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      Alert.alert('Thành công', '✅ Đã đổi mật khẩu thành công!');
      setShowChangePasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng Xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng Xuất',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>⚙️ Cài Đặt</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Cấu hình Google AI cho tính năng thông minh</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Unknown'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
            {user?.role && (
              <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <View style={[styles.appSettingsCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionCardTitle, { color: colors.text, borderBottomColor: colors.border }]}>🎨 Giao Diện</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌙</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Giao diện tối giảm mỏi mắt</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={isDarkMode ? '#2563eb' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' }]}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔐</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Đổi Mật Khẩu</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Cập nhật mật khẩu đăng nhập</Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Configuration Section */}
      <View style={styles.section}>
        <View style={[styles.aiConfigCard, { backgroundColor: colors.cardBg }]}>
          <View style={[styles.aiConfigHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiConfigTitle, { color: colors.text }]}>🤖 Google AI Configuration</Text>
              <TouchableOpacity onPress={openGoogleAIStudio} style={styles.getApiKeyButton}>
                <Text style={styles.getApiKeyLink}>🔑 Lấy API Key miễn phí tại đây</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* API Key Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              API Key <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.apiKeyInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="AIzaSy..."
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey(!showApiKey)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showApiKey ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Nhập Google AI API Key của bạn. API key được lưu trữ an toàn và chỉ bạn mới truy cập được.
            </Text>
          </View>

          {/* Model Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.text }]}>
              Model <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.modelSelector}>
              {AI_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelOption,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                    selectedModel === model.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setSelectedModel(model.id)}
                >
                  <View style={styles.modelOptionContent}>
                    <Text style={[
                      styles.modelOptionName,
                      { color: colors.text },
                      selectedModel === model.id && { color: colors.primary },
                    ]}>
                      {model.name}
                    </Text>
                    <Text style={[styles.modelOptionDesc, { color: colors.textSecondary }]}>{model.description}</Text>
                  </View>
                  {selectedModel === model.id && (
                    <Text style={styles.modelCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Chọn model phù hợp với nhu cầu. Flash nhanh hơn, Pro chất lượng cao hơn.
            </Text>
          </View>

          {/* Model Comparison Table */}
          <View style={[styles.comparisonCard, { backgroundColor: isDarkMode ? '#374151' : '#f9fafb', borderColor: colors.border }]}>
            <Text style={[styles.comparisonTitle, { color: colors.text }]}>📊 So Sánh Models</Text>
            <View style={[styles.comparisonTable, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.tableHeader, { backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6', borderBottomColor: isDarkMode ? '#6b7280' : '#d1d5db' }]}>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.text }]}>Model</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.text }]}>Tốc Độ</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell, { color: colors.text }]}>Chất Lượng</Text>
              </View>
              {AI_MODELS.map((model, index) => (
                <View key={model.id} style={[
                  styles.tableRow,
                  index < AI_MODELS.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#4b5563' : '#f3f4f6' },
                ]}>
                  <Text style={[styles.tableCell, styles.tableCellBold, { color: colors.text }]}>{model.name}</Text>
                  <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{model.speed}</Text>
                  <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{model.quality}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6', borderColor: isDarkMode ? '#6b7280' : '#d1d5db' }, (testing || !apiKey.trim()) && styles.buttonDisabled]}
              onPress={handleTestConnection}
              disabled={testing || !apiKey.trim()}
            >
              {testing ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={isDarkMode ? '#f9fafb' : '#374151'} size="small" />
                  <Text style={[styles.testButtonText, { color: colors.text }]}> Đang kiểm tra...</Text>
                </View>
              ) : (
                <Text style={[styles.testButtonText, { color: colors.text }]}>🧪 Test Connection</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveButtonText}> Đang lưu...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>💾 Lưu Cài Đặt</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Guide Section */}
      <View style={styles.section}>
        <View style={[styles.guideCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.guideTitle, { color: colors.text, borderBottomColor: colors.border }]}>ℹ️ Hướng Dẫn</Text>
          
          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Lấy API Key</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Truy cập Google AI Studio và tạo API key miễn phí
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Nhập API Key</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Dán API key vào form trên và chọn model phù hợp
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Test & Lưu</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Nhấn "Test Connection" để kiểm tra, sau đó "Lưu Cài Đặt"
              </Text>
            </View>
          </View>

          <View style={styles.guideStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Sử Dụng AI</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Tính năng AI Insights và Spending Plans sẽ sử dụng API key của bạn
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.cardBg, borderColor: '#ef4444' }]} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Budget Manager v1.0.0</Text>
        <Text style={[styles.copyright, { color: isDarkMode ? '#6b7280' : '#d1d5db' }]}>© 2026 All rights reserved</Text>
      </View>

      {/* Change Password Modal */}
      <Modal visible={showChangePasswordModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.changePasswordModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔐 Đổi Mật Khẩu</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowChangePasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveButton, changingPassword && styles.buttonDisabled]}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.modalSaveText}> Đang lưu...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalSaveText}>✓ Đổi Mật Khẩu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  // App Settings Card
  appSettingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingArrow: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 8,
  },
  // AI Configuration Card
  aiConfigCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  aiConfigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  getApiKeyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    marginTop: 4,
  },
  getApiKeyLink: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Form Group
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    fontFamily: 'monospace',
  },
  eyeButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 18,
  },
  // Model Selector
  modelSelector: {
    gap: 12,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  modelOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modelOptionNameSelected: {
    color: '#2563eb',
  },
  modelOptionDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  modelCheckmark: {
    fontSize: 20,
    color: '#2563eb',
    marginLeft: 12,
  },
  // Comparison Card
  comparisonCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  comparisonTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  tableCellBold: {
    fontWeight: '600',
    color: '#111827',
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Guide Card
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  guideStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Logout Button
  logoutButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 40,
  },
  version: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#d1d5db',
  },
  // Change Password Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePasswordModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SettingsScreen;
