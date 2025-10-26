import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getApiUrl, API_CONFIG } from '../../config/api';
import { resetStyles as styles } from './reset.styles';

export default function ResetPassword() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request form state
  const [requestEmail, setRequestEmail] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [requestMsg, setRequestMsg] = useState<string | null>(null);

  useEffect(() => {
    // Try to parse token from hash fragment or query
    try {
      if (typeof window !== 'undefined') {
        const hash = (window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(hash || window.location.search);
        const token = params.get('access_token') || params.get('accessToken') || params.get('token');
        if (token) setAccessToken(token);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const handleApply = async () => {
    setError(null);
    setMessage(null);
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!accessToken) {
      setError('No se encontró el token de recuperación en la URL.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PASSWORD_APPLY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, newPassword: password }),
      });
      const text = await resp.text();
      if (resp.ok) {
        setMessage('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
      } else {
        setError(text || `HTTP ${resp.status}`);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    setRequestStatus('sending');
    setRequestMsg('Enviando...');
    try {
      const redirectUri = (typeof window !== 'undefined' && window.location) ? window.location.origin + '/(auth)/reset' : undefined;
      const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PASSWORD_RESET), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestEmail, redirectUri }),
      });
      const text = await resp.text();
      if (resp.ok) {
        setRequestStatus('sent');
        setRequestMsg('Si el correo existe, se envió un email con instrucciones.');
      } else {
        setRequestStatus('error');
        setRequestMsg(text || `HTTP ${resp.status}`);
      }
    } catch (err: any) {
      setRequestStatus('error');
      setRequestMsg(err?.message || String(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Recuperar contraseña</Text>

        {/* Request card (always shown when there's no token) */}
        {!accessToken && (
          <View style={styles.card}>
            <Text style={{ marginBottom: 8 }}>Solicita un correo para recuperar tu contraseña.</Text>
            <TextInput
              placeholder="Correo electrónico"
              value={requestEmail}
              onChangeText={setRequestEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {requestMsg ? <Text style={{ marginTop: 8 }}>{requestMsg}</Text> : null}
            <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
              <TouchableOpacity onPress={handleRequest} disabled={requestStatus === 'sending'} style={styles.primaryButton}>
                {requestStatus === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar correo</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkButton}>
                <Text style={styles.linkText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Apply card (shown when token present) */}
        {accessToken && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Establecer nueva contraseña</Text>
            <TextInput
              placeholder="Nueva contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleApply} disabled={loading} style={styles.primaryButton}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Actualizar contraseña</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkButton}>
                <Text style={styles.linkText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
