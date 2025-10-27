import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getApiUrl, API_CONFIG } from "../config/api";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignInAt: string;
  // Optional profile fields (frontend-only for now)
  fullName?: string;
  profileUrl?: string;
  description?: string;
  carrera?: string;
  universidad?: string;
  semestre?: number;
  onboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
  sendPasswordReset: (email: string, redirectUri?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  register: (fullName: string, email: string, password: string, carrera?: string, universidad?: string, semestre?: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  finishGoogle: (accessToken: string, refreshToken?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  loading: boolean;
  initialLoading: boolean; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  updateUser: (_updates: Partial<User>) => {},
  sendPasswordReset: async (_email: string, _redirectUri?: string) => ({ success: false }),
  login: async (_email: string, _password: string) => ({ success: false }),
  register: async (_fullName: string, _email: string, _password: string) => ({ success: false }),
  finishGoogle: async (_accessToken: string, _refreshToken?: string) => ({ success: false }),
  logout: () => {},
  loading: false,
  initialLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);


  useEffect(() => {
    checkInitialAuthState();
  }, []);

  const checkInitialAuthState = async () => {
    try {
      console.log('Verificando estado inicial de autenticación...');
      
      setTimeout(() => {
        console.log('Verificación inicial completada - no hay usuario guardado');
        setInitialLoading(false);
      }, 1000);
      
    } catch (error) {
      console.log('Error en verificación inicial:', error);
      setInitialLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return { ...(updates as User) };
      return { ...prev, ...updates };
    });
  };

  const sendPasswordReset = async (email: string, redirectUri?: string) => {
    try {
          // If no redirectUri is provided, prefer a localhost dev reset page when
          // running locally. Otherwise fall back to the production frontend reset.
          // The backend will embed this exact absolute URL in the recovery email.
          let redirect = 'http://localhost:8081/reset';
          try {
            if (redirectUri) {
              redirect = redirectUri;
            } else if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
              // Explicitly point to the local frontend reset page requested by the user
              redirect = 'http://localhost:8081/reset';
            }
          } catch (e) {
            // ignore and keep default
          }

      // Debug: log the exact payload we're sending so you can confirm
      // the frontend is not sending any Vercel URL.
      console.debug('sendPasswordReset -> POST', getApiUrl(API_CONFIG.ENDPOINTS.PASSWORD_RESET), { email, redirectUri: redirect });
      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PASSWORD_RESET), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectUri: redirect }),
      });

      if (resp.ok) {
        return { success: true, message: 'Correo de recuperación enviado si el email existe' };
      }

      const text = await resp.text();
      return { success: false, error: text || 'Error en el servidor' };
    } catch (err) {
      console.error('Error sendPasswordReset:', err);
      return { success: false, error: 'Error de conexión' };
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log('Enviando login con:', { email, password });
    
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      console.log('Status de respuesta:', response.status);
      
      if (response.ok) {
        const loginData = await response.json();
        console.log('Login exitoso:', loginData);
        
  
        setUser(loginData.user);
  

        
        return { success: true, data: loginData };
      } else {
        const errorData = await response.text();
        console.error('Error del servidor:', errorData);
        return { success: false, error: 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('Error de red:', error);
      return { success: false, error: 'Error de conexión. Verifica tu red.' };
    } finally {
      setLoading(false);
    }
  };

  const finishGoogle = async (accessToken: string, refreshToken?: string) => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_FINISH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // backend returns LoginResponse-like object
        if (data?.user) {
          setUser(data.user);
        }
        return { success: true, data };
      }

      const text = await resp.text();
      return { success: false, error: text || 'Error en el servidor' };
    } catch (err) {
      console.error('Error finishGoogle:', err);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, carrera?: string, universidad?: string, semestre?: number) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          carrera: carrera || '',
          universidad: universidad || '',
          semestre: semestre || 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Register exitoso:', data);
        // If backend returns a user object use it, otherwise create a local user object
        // including the values the user just entered so the profile screen shows them.
        const now = new Date().toISOString();
        const newUser = data?.user
          ? data.user
          : {
              id: data?.user?.id || 'local-' + Math.random().toString(36).slice(2, 9),
              email,
              role: data?.user?.role || 'user',
              createdAt: data?.user?.createdAt || now,
              lastSignInAt: data?.user?.lastSignInAt || now,
              fullName,
              carrera: carrera || '',
              universidad: universidad || '',
              semestre: semestre || 0,
            };

        setUser(newUser);
        return { success: true, data };
      } else {
        const text = await response.text();
        console.error('Error register:', text);
        return { success: false, error: 'No se pudo registrar' };
      }
    } catch (error) {
      console.error('Error de red en register:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Cerrando sesión...');
    setUser(null);
  
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      updateUser,
      sendPasswordReset,
      finishGoogle,
      logout, 
      loading, 
      initialLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
