import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Platform, Linking } from 'react-native';
import { getApiUrl, API_CONFIG } from '../../config/api';
import { useAuth } from "../../context/AuthContext";
import { loginStyles as styles } from "./login.styles";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);
  const { sendPasswordReset } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email y contraseña requeridos");
      return;
    }

    setError("");

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log("Login exitoso, mostrando pantalla de carga");
        
        setShowSuccessLoading(true);
        
        
        fadeAnim.setValue(0);
        logoScale.setValue(0.8);
        
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
        
        
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 2000);
      } else {
        setError(result.error || "Error de autenticación");
      }
    } catch (error) {
      console.error("Error en handleLogin:", error);
      setError("Error inesperado. Intenta de nuevo.");
    }
    
  };


  if (showSuccessLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require("../../assets/images/Logo-SaviaU.png")}
            style={[styles.loadingLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#198754" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Cargando SaviaU...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/Fondo.png")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <View style={styles.centeredContainer}>
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Animated.View 
            style={[
              { alignItems: "center", marginBottom: 32 },
              { transform: [{ scale: logoScale }] }
            ]}
          >
            <Image
              source={require("../../assets/images/Logo-SaviaU.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#28a745" }]}
            onPress={() => router.replace("/(auth)/register")}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>

          {/* Google Sign-in button */}
          <TouchableOpacity onPress={async () => {
            try {
              const redirectTo = (typeof window !== 'undefined' && window.location) ? window.location.origin + '/oauth' : undefined;
              const params = new URLSearchParams();
              if (redirectTo) params.set('redirectTo', redirectTo);
              const resp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GOOGLE_URL) + (params.toString() ? ('?' + params.toString()) : ''));
              if (!resp.ok) throw new Error('No se pudo obtener URL de Google');
              const data = await resp.json();
              const url = data?.url;
              if (!url) throw new Error('URL no encontrada');
              if (Platform.OS === 'web') {
                window.location.href = url;
              } else {
                await Linking.openURL(url);
              }
            } catch (err) {
              console.error('Error iniciar Google auth:', err);
            }
          }} style={[styles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
            <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={{ width: 20, height: 20, marginRight: 10 }} />
            <Text style={{ color: '#444', fontWeight: '700' }}>Ingresar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText} onPress={() => { setForgotEmail(email); setForgotVisible(true); }}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Forgot password modal (manages its own sending state and inline feedback) */}
      <ForgotModal
        visible={forgotVisible}
        onClose={() => setForgotVisible(false)}
        email={forgotEmail}
        sendFn={sendPasswordReset}
      />
    </ImageBackground>
  );
}

// Modal outside component to keep file tidy
function ForgotModal({ visible, onClose, email, sendFn }: { visible: boolean; onClose: () => void; email?: string; sendFn: (email: string, redirectUri?: string) => Promise<{ success: boolean; message?: string; error?: string }> }) {
  const [value, setValue] = useState(email || '');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  React.useEffect(() => setValue(email || ''), [email]);

  const handleSend = async () => {
    if (!value || !value.includes('@')) {
      setErrorMsg('Ingresa un correo válido');
      setStatus('error');
      return;
    }
    setErrorMsg(undefined);
    setStatus('sending');
    try {
      const redirectUri = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin + '/reset'
        : undefined;
      const res = await sendFn(value, redirectUri);
      if (res.success) {
        setStatus('sent');
        setLastSentAt(Date.now());
      } else {
        setStatus('error');
        setErrorMsg(res.error || 'Error desconocido');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Error de conexión');
    }
  };

  const timeSince = (ts: number | null) => {
    if (!ts) return '';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: '#0b0b0b', padding: 18, borderRadius: 12, width: '90%', maxWidth: 720, alignSelf: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Recuperar contraseña</Text>
          <Text style={{ color: '#ddd', marginBottom: 8 }}>Ingresa el correo asociado a tu cuenta y recibirás instrucciones.</Text>

          <TextInput value={value} onChangeText={(t) => { setValue(t); if (status !== 'idle') { setStatus('idle'); setErrorMsg(undefined); } }} placeholder="Correo electrónico" placeholderTextColor="#999" style={{ backgroundColor: '#0b0b0b', borderColor: '#2b2b2b', borderWidth: 1, padding: 12, borderRadius: 8, color: '#fff', marginBottom: 12, width: '100%' }} keyboardType="email-address" autoCapitalize="none" />

          {/* Inline feedback area */}
          {status === 'sent' ? (
            <View style={{ backgroundColor: '#0b2f1a', borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: '#bff0d6', fontWeight: '700' }}>Instrucciones enviadas</Text>
              <Text style={{ color: '#cfefdc', fontSize: 12 }}>Enviado hace {timeSince(lastSentAt)} — revisa tu bandeja y spam.</Text>
            </View>
          ) : null}

          {status === 'error' && errorMsg ? (
            <View style={{ backgroundColor: '#3b1a1a', borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: '#ffd6d6', fontWeight: '700' }}>Error</Text>
              <Text style={{ color: '#ffcfcf', fontSize: 12 }}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
              <Text style={{ color: '#bbb' }}>{status === 'sent' ? 'Cerrar' : 'Cancelar'}</Text>
            </TouchableOpacity>

            {status === 'sent' ? (
              <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#198754', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Reenviar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSend} disabled={status === 'sending'} style={{ backgroundColor: '#198754', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, marginLeft: 8 }}>
                {status === 'sending' ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Enviar</Text>}
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
