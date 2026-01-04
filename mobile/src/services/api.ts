import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình API URL - sử dụng IP máy local hoặc backend URL
const API_URL = __DEV__ 
  ? 'http://10.0.250.188:5000/api'  // IP máy local - thay đổi nếu IP thay đổi
  : 'https://budman.roger.works/api'; // URL production

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized request');
    } else if (error.response?.status === 500) {
      console.error('Server error');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - không thể kết nối tới server');
    }
    return Promise.reject(error);
  }
);

export default api;
