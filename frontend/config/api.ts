
import { Platform } from 'react-native';

export const API_CONFIG = {
  // En desarrollo, en emulador Android 'localhost' no apunta al host Windows.
  // Usamos 10.0.2.2 para Android emulator, localhost para iOS/simulador, y la URL remota en producción.
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'
      : 'http://localhost:8080'
    : 'https://saviau.onrender.com',

  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PASSWORD_RESET: '/api/auth/password/reset',
    PASSWORD_APPLY: '/api/auth/password/apply',
  }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;