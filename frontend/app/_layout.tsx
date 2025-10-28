import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext'; 

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="diagnostic" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
  </Stack>
  <AuthGate />
  </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useRouter } from 'expo-router';

// Navigation guard that redirects to /diagnostic when needed.
function AuthGate() {
  const { user, diagnosticCompleted, initialLoading, adminToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialLoading) return;
    // Determine current path (web fallback to window.location)
    let path = '';
    try {
      if (typeof window !== 'undefined' && window.location && window.location.pathname) path = window.location.pathname;
    } catch (e) {}
    try {
      if (!path && (router as any).pathname) path = (router as any).pathname;
    } catch (e) {}

    // 1) Si es admin, fuerce ir al panel (evita tabs/home/diagnostic)
    if (user && adminToken) {
      if (!path.includes('/(admin)')) {
        router.replace('/(admin)');
        return;
      }
    }

    // 2) Si no es admin y NO ha completado diagnóstico, redirigir a /diagnostic
    // excepto cuando ya estamos en /diagnostic, en rutas de auth o en la pantalla de perfil.
    if (
      user &&
      !diagnosticCompleted &&
      !adminToken &&
      !path.includes('/diagnostic') &&
      !path.includes('/(auth)') &&
      !path.includes('/(tabs)/perfil')
    ) {
      router.replace('/diagnostic');
    }
  }, [user, diagnosticCompleted, adminToken, initialLoading]);

  return null;
}

