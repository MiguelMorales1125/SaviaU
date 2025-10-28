import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

// Removed unused types and constants
// type UserRow = {
//   id: string;
//   email: string;
//   role?: string;
//   createdAt?: string;
// };

// const MOCK_USERS: UserRow[] = [
//   { id: 'u1', email: 'ana@example.com', role: 'user', createdAt: '2024-01-10' },
//   { id: 'u2', email: 'carlos@example.com', role: 'user', createdAt: '2024-03-02' },
//   { id: 'u3', email: 'admin@example.com', role: 'admin', createdAt: '2023-11-20' },
// ];

export default function AdminPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, adminToken, logout } = useAuth();
  const navigatingRef = useRef(false);

  const isAdmin = user?.role === 'admin' || Boolean(adminToken);

  // Oculta el header para no mostrar flecha atrás
  useEffect(() => {
    try { (navigation as any)?.setOptions?.({ headerShown: false }); } catch {}
  }, [navigation]);

  // Si el usuario intenta volver atrás, cerrar sesión automáticamente (sin loop)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const onBeforeRemove = (e: any) => {
      const actionType = e?.data?.action?.type;
      // Intercept only real back actions
      if (actionType !== 'GO_BACK' && actionType !== 'POP') {
        return;
      }
      if (navigatingRef.current) return;
      try { e?.preventDefault?.(); } catch {}
      navigatingRef.current = true;
      try { logout(); } catch {}
      // Remove listener before navigating to avoid recursion
      try { unsub && unsub(); } catch {}
      setTimeout(() => router.replace('/(auth)/login'), 0);
    };

    unsub = navigation.addListener('beforeRemove', onBeforeRemove);

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigatingRef.current) return true;
      navigatingRef.current = true;
      try { logout(); } catch {}
      setTimeout(() => router.replace('/(auth)/login'), 0);
      return true;
    });

    let popHandler: ((this: Window, ev: PopStateEvent) => any) | undefined;
    if (Platform.OS === 'web') {
      popHandler = () => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        try { logout(); } catch {}
        setTimeout(() => router.replace('/(auth)/login'), 0);
      };
      try { window.addEventListener('popstate', popHandler); } catch {}
    }

    return () => {
      try { unsub && unsub(); } catch {}
      try { backSub.remove(); } catch {}
      if (Platform.OS === 'web' && popHandler) {
        try { window.removeEventListener('popstate', popHandler); } catch {}
      }
    };
  }, [navigation, router, logout]);

  const onLogoutPress = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    try { logout(); } catch {}
    // Use replace to reset stack
    setTimeout(() => router.replace('/(auth)/login'), 0);
  };


  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.containerLight}
    >
      {/* Botón cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogoutPress}
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
      {/* Contenido centrado */}
      <View style={styles.centerBox} pointerEvents="box-none">
        <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.brandLogoBig} resizeMode="contain" />
        <Text style={styles.brandTitleBig}>ADMIN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor claro con paleta SaviaU
  containerLight: { flex: 1, padding: 20, backgroundColor: '#eaf7ef' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brandLogoBig: { width: 180, height: 180, marginBottom: 8 },
  brandTitleBig: { color: '#198754', fontWeight: '900', fontSize: 28, letterSpacing: 6 },
  logoutButton: { position: 'absolute', right: 20, top: 20, backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, zIndex: 999, elevation: 4 },
  logoutButtonText: { color: '#fff', fontWeight: '800' },
});
