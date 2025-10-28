
import { Platform } from 'react-native';

export const API_CONFIG = {
  // En desarrollo, en emulador Android 'localhost' no apunta al host Windows.
  // Usamos 10.0.2.2 para Android emulator, localhost para iOS/simulador, y la URL remota en producción.
  // Base URL for the backend API. In development use localhost (or emulator special address).
  // In production prefer an explicit env var EXPO_PUBLIC_API_BASE_URL so deployments can point to
  // the correct backend (avoid hardcoding). If not provided, fall back to the previous value.
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080'
    : (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://saviau.onrender.com'),

  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PASSWORD_RESET: '/api/auth/password/reset',
    PASSWORD_APPLY: '/api/auth/password/apply',
      GOOGLE_URL: '/api/auth/google/url',
      GOOGLE_FINISH: '/api/auth/google/finish',
      ONBOARD: '/api/auth/onboard',
      ADMIN_LOGIN: '/api/admin/auth/login',
  }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;