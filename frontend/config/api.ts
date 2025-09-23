// Configuración de API endpoints
export const API_CONFIG = {
  // Detectar automáticamente el entorno
  BASE_URL: __DEV__ ? 'http://localhost:8080' : 'https://saviau.onrender.com',
  
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    // Agregar más endpoints aquí según necesites
  }
};

// Helper para construir URLs completas
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};