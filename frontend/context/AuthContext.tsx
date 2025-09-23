import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignInAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  loading: boolean;
  initialLoading: boolean; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async (_email: string, _password: string) => ({ success: false }),
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

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log('Enviando login con:', { email, password });
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
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

  const logout = () => {
    console.log('Cerrando sesión...');
    setUser(null);
  
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
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
