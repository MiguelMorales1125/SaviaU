// Configuración de API endpoints
export const API_CONFIG = {
  // Para desarrollo local
  // BASE_URL: 'http://localhost:8080',
  
  // Para producción (Render)
  BASE_URL: 'https://saviau.onrender.com',
  
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