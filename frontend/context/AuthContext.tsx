/*
  AuthContext.tsx

  Propósito (ES): Proveedor de autenticación centralizado para la aplicación.
  - Administra el usuario actual, tokens (supabase), estado de onboarding y diagnóstico.
  - Expone funciones para login, registro, OAuth finalización, onboard y reset de contraseña.
  - Persiste datos relevantes en `localStorage` para evitar redirecciones/flash innecesarios.
  - Nota: Este archivo es frontend-only; no modifica el backend.
*/
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getApiUrl, API_CONFIG } from "../config/api";
import { fetchDiagnosticStatus } from '../services/diagnostic';

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
  onboard: (accessTokenOrUndefined: string | undefined, fullName: string, carrera: string, universidad: string, semestre: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  // Supabase access token (from social login or frontend auth) - optional
  supabaseAccessToken?: string | undefined;
  setSupabaseAccessToken: (token?: string) => void;
  // Diagnostic completion flag
  diagnosticCompleted: boolean;
  setDiagnosticCompleted: (v: boolean) => void;
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
  onboard: async (_accessTokenOrUndefined: string | undefined, _fullName: string, _carrera: string, _universidad: string, _semestre: number) => ({ success: false }),
  supabaseAccessToken: undefined,
  setSupabaseAccessToken: (_token?: string) => {},
  diagnosticCompleted: false,
  setDiagnosticCompleted: (_v: boolean) => {},
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
  const [supabaseAccessToken, setSupabaseAccessToken] = useState<string | undefined>(undefined);
  const [supabaseRefreshToken, setSupabaseRefreshToken] = useState<string | undefined>(undefined);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState<boolean>(false);


  useEffect(() => {
    checkInitialAuthState();
  }, []);

  const checkInitialAuthState = async () => {
    try {
      console.log('Verificando estado inicial de autenticación...');
      // restore persisted supabase access token and diagnostic flag (web only)
      let t: string | null = null;
      let d: string | null = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          t = window.localStorage.getItem('supabaseAccessToken');
          d = window.localStorage.getItem('diagnosticCompleted');
          if (t) setSupabaseAccessToken(t);
          if (d) setDiagnosticCompleted(d === 'true');

          // If we have a token but no persisted diagnostic flag, ask the backend
          // for the authoritative status so the navigation guard won't flash the
          // diagnostic screen for users who already completed it.
          try {
            if (t && !d) {
              const st = await fetchDiagnosticStatus(t);
              if (st && st.completed) {
                setDiagnosticCompleted(true);
                try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
              }
            }
          } catch (e) {
            // ignore status check failures here — we'll show diagnostic if unsure
          }
        }
      } catch (e) {
        // ignore
      }

      // Previously we cleared initialLoading after a short timeout which could
      // cause the diagnostic screen to flash while we were still asking the
      // backend whether the user had already completed it. Keep the app in the
      // initial loading state until the status check finishes or a short
      // timeout elapses to avoid a visible flash.
      try {
        // If we already checked localStorage above and found a persisted
        // diagnostic flag, we can finish immediately. Otherwise, if we have a
        // token, race the backend check against a small timeout so the app
        // doesn't stall too long.
        if (!((typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('diagnosticCompleted')))) {
          // nothing to do here — the code above may have initiated a status check
        }
      } catch (e) {
        // ignore
      }

      // If we started a diagnostic status check above, wait for it to finish
      // but cap the wait with a reasonable timeout so the app doesn't stall.
  const timeoutMs = 12000; // maximum wait for backend status (shows loader during wait)
      try {
        if (t && !d) {
          // race the fetch against a timeout
          const statusPromise = (async () => {
            try {
              const st = await fetchDiagnosticStatus(t);
              if (st && st.completed) {
                setDiagnosticCompleted(true);
                try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
              }
            } catch (e) {
              // ignore individual failures — we'll proceed after timeout
            }
          })();

          await Promise.race([
            statusPromise,
            new Promise(resolve => setTimeout(resolve, timeoutMs)),
          ]);
        }
      } catch (e) {
        // ignore
      }

      console.log('Verificación inicial completada - estado cargado');
      setInitialLoading(false);
      
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
        // If backend returned a Supabase access token (some deployments may), persist it.
        // Backends may use either `supabaseAccessToken` or `accessToken` in responses.
        const tokenFromResp = loginData?.supabaseAccessToken || loginData?.accessToken || loginData?.appToken;
        const refreshFromResp = loginData?.refreshToken;
        if (tokenFromResp) {
          setSupabaseAccessToken(tokenFromResp);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('supabaseAccessToken', tokenFromResp); } catch(e) {}
        }
        if (refreshFromResp) {
          setSupabaseRefreshToken(refreshFromResp);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('supabaseRefreshToken', refreshFromResp); } catch(e) {}
        }
        // Merge returned user and persist diagnosticCompleted if present
        setUser(loginData.user);
        // Política solicitada: si el usuario ya está registrado e inicia sesión de nuevo,
        // no mostrar diagnóstico. Marcamos el flag como completado para evitar redirecciones.
        if (loginData?.user?.diagnosticCompleted) {
          setDiagnosticCompleted(true);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
        } else {
          setDiagnosticCompleted(true);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
        }
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
      // store supabase tokens so we can call /onboard later if needed
      if (accessToken) setSupabaseAccessToken(accessToken);
      if (refreshToken) setSupabaseRefreshToken(refreshToken);
      try { if (typeof window !== 'undefined' && window.localStorage && accessToken) window.localStorage.setItem('supabaseAccessToken', accessToken); } catch(e) {}
      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_FINISH), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // backend returns LoginResponse-like object
  if (data?.user) {
          // Determine whether the backend considers the user onboarded. Some
          // deployments return `user.onboarded`, others include profile fields
          // like `fullName`. Treat presence of a fullName as evidence of
          // onboarding so we don't force the user to re-fill the form.
          const isOnboarded = Boolean(data.user?.onboarded || data.user?.fullName);
          const mergedUser = { ...data.user, onboarded: isOnboarded } as any;
          setUser(mergedUser);
          // persist a simple onboarded flag in localStorage to avoid repeated redirects
          try { if (typeof window !== 'undefined' && window.localStorage) {
            if (isOnboarded) window.localStorage.setItem('onboarded', 'true');
            else window.localStorage.removeItem('onboarded');
          } } catch(e) {}
          // if backend indicates diagnostic completed in returned user, persist it
          // Para usuarios ya registrados que vuelven a iniciar sesión con Google,
          // evita mostrar diagnóstico tratando el flag como completado.
          if (data.user?.diagnosticCompleted || mergedUser.onboarded) {
            setDiagnosticCompleted(true);
            try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
          } else {
            setDiagnosticCompleted(true);
            try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
          }
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

  const onboard = async (accessTokenOrUndefined: string | undefined, fullName: string, carrera: string, universidad: string, semestre: number) => {
    setLoading(true);
    try {
      const tokenToUse = accessTokenOrUndefined || supabaseAccessToken;
      if (!tokenToUse) {
        return { success: false, error: 'No Supabase access token available for onboarding' };
      }

      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ONBOARD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenToUse, fullName, carrera, universidad, semestre }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // backend should return updated user; merge into state
        if (data?.user) {
          const merged = { ...(data.user || {}), onboarded: true } as any;
          setUser((prev) => ({ ...(prev || {}), ...merged } as any));
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('onboarded', 'true'); } catch(e) {}
          if (data.user?.diagnosticCompleted) {
            setDiagnosticCompleted(true);
            try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', 'true'); } catch(e) {}
          }
        } else {
          // if backend doesn't return full user, at least update local fields
          setUser((prev) => {
            if (!prev) return { fullName, carrera, universidad, semestre, onboarded: true } as any;
            return { ...prev, fullName, carrera, universidad, semestre, onboarded: true } as any;
          });
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('onboarded', 'true'); } catch(e) {}
        }

        return { success: true, data };
      }

      const text = await resp.text();
      return { success: false, error: text || 'Error en el servidor' };
    } catch (err: any) {
      console.error('Error onboard:', err);
      return { success: false, error: err?.message || String(err) };
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
        // If the registration included a fullName, consider the profile onboarded
        try { if (typeof window !== 'undefined' && window.localStorage) {
          if (newUser?.fullName) window.localStorage.setItem('onboarded', 'true');
        } } catch(e) {}
        // If backend returned a supabase token at register, persist it.
        const tokenFromReg = data?.supabaseAccessToken || data?.accessToken || data?.appToken;
        const refreshFromReg = data?.refreshToken;
        if (tokenFromReg) {
          setSupabaseAccessToken(tokenFromReg);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('supabaseAccessToken', tokenFromReg); } catch(e) {}
        }
        if (refreshFromReg) {
          setSupabaseRefreshToken(refreshFromReg);
          try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('supabaseRefreshToken', refreshFromReg); } catch(e) {}
        }
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
    setSupabaseAccessToken(undefined);
    setDiagnosticCompleted(false);
    try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.removeItem('supabaseAccessToken'); window.localStorage.removeItem('diagnosticCompleted'); } } catch(e) {}
  
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      updateUser,
      sendPasswordReset,
      finishGoogle,
      onboard,
      // expose supabase token and setters
      supabaseAccessToken,
      setSupabaseAccessToken: (t?: string) => { setSupabaseAccessToken(t); try { if (typeof window !== 'undefined' && window.localStorage) { if (t) window.localStorage.setItem('supabaseAccessToken', t); else window.localStorage.removeItem('supabaseAccessToken'); } } catch(e) {} },
      diagnosticCompleted,
      setDiagnosticCompleted: (v: boolean) => { setDiagnosticCompleted(v); try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('diagnosticCompleted', v ? 'true' : 'false'); } catch(e) {} },
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
