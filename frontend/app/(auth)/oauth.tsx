import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function OAuthFinish() {
  const router = useRouter();
  const { finishGoogle } = useAuth();
  // Start in 'working' so we don't briefly flash the error message on mount
  // while the redirect URL / token is being parsed.
  const [status, setStatus] = useState<'working' | 'success' | 'error' | 'idle'>('working');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timeoutHandle: number | null = null;
    let finished = false;
    let subscription: { remove: () => void } | null = null;

    const extractParamsFromUrl = (urlStr: string | null) => {
      if (!urlStr) return null;
      try {
        // url may contain fragment (#access_token=...) or query (?access_token=...)
        const u = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
        // Prefer fragment (hash) if present
        const hash = (u.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(hash || u.search);
        return params;
      } catch (e) {
        return null;
      }
    };

    const parseAndFinish = async (incomingUrl?: string) => {
      try {
        let params = null;

        console.debug('parseAndFinish called, incomingUrl=', incomingUrl);

        if (incomingUrl) {
          params = extractParamsFromUrl(incomingUrl);
        } else if (typeof window !== 'undefined' && window.location) {
          const hash = (window.location.hash || '').replace(/^#/, '');
          params = new URLSearchParams(hash || window.location.search);
        }

        if (!params) {
          console.debug('No params found in URL');
          return false;
        }

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        console.debug('Extracted access_token:', accessToken, 'refresh_token:', refreshToken);

        if (!accessToken) return false;

        setStatus('working');
        const res = await finishGoogle(accessToken, refreshToken || undefined);
        if (res.success) {
          finished = true;
          setStatus('success');
          setMsg('Login con Google completado. Redirigiendo...');
          // If backend indicates user is not onboarded, redirect to onboarding screen
          const isOnboarded = Boolean(res.data?.user?.onboarded);
          setTimeout(() => {
            if (!isOnboarded) {
              router.replace('/(auth)/onboard');
            } else {
              router.replace('/(tabs)/home');
            }
          }, 1200);
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
      // Try immediately and then listen for hash changes (web) or Linking events (native)
      setStatus('working');

      const start = Date.now();
      const deadline = 3000; // ms to wait for fragment

      // Try now (web or deep link) and also listen for changes / incoming urls
      if (typeof window !== 'undefined' && window.location) {
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
      } else {
        // Native: try initial URL and listen for Linking events
        try {
          const initial = await Linking.getInitialURL();
          if (initial && await parseAndFinish(initial)) return;
        } catch (e) {
          // ignore
        }

        const onLink = async ({ url }: { url: string }) => {
          if (finished) return;
          console.debug('Linking event url:', url);
          if (await parseAndFinish(url)) {
            try { subscription?.remove(); } catch(e) {}
          }
        };

        subscription = Linking.addEventListener ? Linking.addEventListener('url', onLink) : { remove: () => {} };

        // Fallback timeout to show friendly error
        timeoutHandle = window?.setTimeout ? window.setTimeout(() => {
          if (!finished) {
            finished = true;
            setStatus('error');
            setMsg('No se recibió la redirección de autenticación en la app');
          }
        }, deadline) : global.setTimeout(() => {
          if (!finished) {
            finished = true;
            setStatus('error');
            setMsg('No se recibió la redirección de autenticación en la app');
          }
        }, deadline);
      }

      const cleanup = () => {
        try {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle as any);
            timeoutHandle = null;
          }
          if (subscription) {
            try { subscription.remove(); } catch (e) {}
            subscription = null;
          }
        } catch (e) {}
      };
    };

    tryUntilTimeout();

    return () => {
      try { window.removeEventListener('hashchange', () => {}); } catch(e) {}
    };
  }, []);

  // On error, show a clear message and a button to go back to login so the user can
  // inspect the cause instead of being silently redirected.
  // (Previously we auto-redirected which made debugging difficult.)

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {/* Always show a neutral waiting state while finishing Google login.
          If success, show confirmation; if error, auto-redirect to login silently. */}
      {status === 'success' ? (
        <Text>{msg}</Text>
      ) : status === 'working' ? (
        <>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12 }}>Finalizando login con Google...</Text>
        </>
      ) : (
        // status === 'error' or 'idle'
        <>
          <Text style={{ color: '#f66', fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>{msg || 'No se encontró el token de autenticación.'}</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ backgroundColor: '#198754', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Ir al login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
