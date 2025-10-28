import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';

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

    // 1) Strip tokens from URL immediately on mount (web) while caching them in sessionStorage
    try {
      if (typeof window !== 'undefined' && window.location) {
        const u = new URL(window.location.href);
        // Prefer hash first as most providers return it
        const hash = (u.hash || '').replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        const qParams = new URLSearchParams(u.search);
        const a = hashParams.get('access_token') || qParams.get('access_token') || hashParams.get('accessToken') || qParams.get('accessToken') || hashParams.get('token') || qParams.get('token');
        const r = hashParams.get('refresh_token') || qParams.get('refresh_token') || '';
        if (a || r) {
          try {
            if (a) window.sessionStorage?.setItem('oauth_access_token', a);
            if (r) window.sessionStorage?.setItem('oauth_refresh_token', r);
          } catch (e) {}

          // Remove sensitive params from both places and replace URL
          ['access_token','accessToken','token','refresh_token','id_token','expires_in','token_type','scope'].forEach(k => { hashParams.delete(k); qParams.delete(k); });
          u.hash = hashParams.toString() ? `#${hashParams.toString()}` : '';
          u.search = qParams.toString() ? `?${qParams.toString()}` : '';
          try { window.history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
        }
      }
    } catch (e) { /* ignore */ }

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

        // First try URL params; if absent, try sessionStorage (set in early strip)
        if (!params || (!params.get('access_token') && !params.get('accessToken') && !params.get('token'))) {
          try {
            const stA = typeof window !== 'undefined' ? window.sessionStorage?.getItem('oauth_access_token') : undefined;
            const stR = typeof window !== 'undefined' ? window.sessionStorage?.getItem('oauth_refresh_token') : undefined;
            if (stA || stR) {
              const p = new URLSearchParams();
              if (stA) p.set('access_token', stA);
              if (stR) p.set('refresh_token', stR);
              params = p;
            }
          } catch (e) {}
        }

        if (!params) {
          console.debug('No params found in URL or storage');
          return false;
        }

  const accessToken = params.get('access_token') || params.get('accessToken') || params.get('token');
  const refreshToken = params.get('refresh_token');
        console.debug('Extracted access_token:', accessToken, 'refresh_token:', refreshToken);

        if (!accessToken) return false;

        // Remove tokens from the address bar so they don't remain visible
        try {
          if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
            try {
              const u = new URL(window.location.href);
              // remove token-like params from search
              const searchParams = new URLSearchParams(u.search);
              ['access_token', 'accessToken', 'token', 'refresh_token', 'id_token', 'expires_in', 'token_type', 'scope']
                .forEach(k => searchParams.delete(k));
              u.search = searchParams.toString() ? `?${searchParams.toString()}` : '';
              // remove token-like params from hash
              const hash = (u.hash || '').replace(/^#/, '');
              if (hash) {
                const hashParams = new URLSearchParams(hash);
                ['access_token', 'accessToken', 'token', 'refresh_token', 'id_token', 'expires_in', 'token_type', 'scope']
                  .forEach(k => hashParams.delete(k));
                u.hash = hashParams.toString() ? `#${hashParams.toString()}` : '';
              }
              window.history.replaceState(null, '', u.pathname + u.search + u.hash);
            } catch (e) {
              // ignore any url/replace errors
            }
          }
        } catch (e) {}

        // Clear cached tokens from sessionStorage once captured
        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage?.removeItem('oauth_access_token');
            window.sessionStorage?.removeItem('oauth_refresh_token');
          }
        } catch (e) {}
        setStatus('working');
        const res = await finishGoogle(accessToken, refreshToken || undefined);
        if (res.success) {
          finished = true;
          setStatus('success');
          setMsg('Login con Google completado. Redirigiendo...');
          // If backend indicates user is not onboarded, redirect to onboarding screen
          // Consider the user onboarded if backend returns onboarded or a profile field
          const isOnboarded = Boolean(
            res.data?.user?.onboarded ||
            res.data?.user?.fullName ||
            (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('onboarded') === 'true')
          );
          // Extra check: ask backend profile status to detect usuarios row and avoid showing onboarding/diagnostic for returning users
          let remoteOnboarded = false;
          try {
            const url = getApiUrl(`/api/auth/profile/status?accessToken=${encodeURIComponent(accessToken)}`);
            const r = await fetch(url);
            if (r.ok) {
              const j = await r.json();
              remoteOnboarded = Boolean(j?.exists || j?.complete || (j?.isNewUser === false));
            }
          } catch (e) {
            // ignore network errors here, we'll fall back to local rules
          }
          setTimeout(() => {
            if (!(isOnboarded || remoteOnboarded)) {
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

  const seoMessage = status === 'success'
    ? (msg || 'Inicio de sesión con Google completado')
    : status === 'working'
      ? 'Finalizando login con Google...'
      : (msg || 'No se encontró el token de autenticación.');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#ffffff' }}>
      <Head>
        <title>Conectando con Google • SaviaU</title>
        <meta name="description" content={seoMessage} />
      </Head>
      {status === 'success' ? (
        <>
          <Image source={require('../../assets/images/SaviaU-Logo.png')} style={{ width: 160, height: 160, marginBottom: 8 }} resizeMode="contain" />
        </>
      ) : status === 'working' ? (
        <>
          <Image source={require('../../assets/images/SaviaU-Logo.png')} style={{ width: 160, height: 160, marginBottom: 12 }} resizeMode="contain" />
          <ActivityIndicator size="large" color="#198754" />
        </>
      ) : (
        <>
          <Image source={require('../../assets/images/SaviaU-Logo.png')} style={{ width: 160, height: 160, marginBottom: 12 }} resizeMode="contain" />
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ backgroundColor: '#198754', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Ir al login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
