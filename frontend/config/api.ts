
export const API_CONFIG = {

  BASE_URL: __DEV__ ? 'http://localhost:8080' : 'https://saviau.onrender.com',
  
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',

  }
};


export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};