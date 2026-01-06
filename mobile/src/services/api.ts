// mobile/src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Thay đổi URL này thành IP LAN hoặc URL Tunnel của bạn
const BASE_URL = 'https://budman.roger.works/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor thêm Token (Sửa localStorage thành AsyncStorage)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token'); // Đã sửa
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;