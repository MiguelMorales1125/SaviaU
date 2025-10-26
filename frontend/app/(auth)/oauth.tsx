import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function OAuthFinish() {
  const router = useRouter();
  const { finishGoogle } = useAuth();
  const [status, setStatus] = useState<'working' | 'success' | 'error' | 'idle'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timeoutHandle: number | null = null;
    let finished = false;

    const parseAndFinish = async () => {
      try {
        const hash = (window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(hash || window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) return false;

        setStatus('working');
        const res = await finishGoogle(accessToken, refreshToken || undefined);
        if (res.success) {
          finished = true;
          setStatus('success');
          setMsg('Login con Google completado. Redirigiendo...');
          setTimeout(() => router.replace('/(tabs)/home'), 1200);
        } else {
          finished = true;
          setStatus('error');
          setMsg(res.error || 'Error al finalizar login con Google');
        }
        return true;
      } catch (err: any) {
        finished = true;
        setStatus('error');
        setMsg(err?.message || String(err));
        return true;
      }
    };

    const tryUntilTimeout = async () => {
      // First attempt immediately
      if (typeof window === 'undefined') {
        setStatus('error');
        setMsg('No hay ventana disponible para leer el token');
        return;
      }

      setStatus('working');

      const start = Date.now();
      const deadline = 3000; // ms to wait for fragment

      // Try now and also listen for hash changes
      if (await parseAndFinish()) return;

      const onHash = async () => {
        if (finished) return;
        if (await parseAndFinish()) {
          cleanup();
        }
      };

      window.addEventListener('hashchange', onHash);

      // Poll a couple times as well (some providers may set query instead)
      const poll = async () => {
        if (finished) return;
        if (await parseAndFinish()) {
          cleanup();
          return;
        }
        if (Date.now() - start >= deadline) {
          // show a friendly message instead of immediate error
          finished = true;
          setStatus('error');
          setMsg('No se encontró access_token en la URL después de la redirección');
          cleanup();
        } else {
          timeoutHandle = window.setTimeout(poll, 400);
        }
      };

      timeoutHandle = window.setTimeout(poll, 400);

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        try { window.removeEventListener('hashchange', onHash); } catch(e) {}
      };
    };

    tryUntilTimeout();

    return () => {
      try { window.removeEventListener('hashchange', () => {}); } catch(e) {}
    };
  }, []);

  // If an error happens, redirect to login after a short delay (silent handling — no error UI)
  useEffect(() => {
    if (status === 'error') {
      const t = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 900);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Always show a neutral waiting state while finishing Google login.
          If success, show confirmation; if error, auto-redirect to login silently. */}
      {status === 'success' ? (
        <Text>{msg}</Text>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>{status === 'error' ? 'Redirigiendo al login...' : 'Finalizando login con Google...'}</Text>
        </>
      )}
    </View>
  );
}
