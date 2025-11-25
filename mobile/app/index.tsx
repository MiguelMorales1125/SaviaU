import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, initialLoading, adminToken } = useAuth();
  
  useEffect(() => {
    if (initialLoading) return;

    // Si hay un usuario autenticado, redirigir según su rol
    if (user) {
      if (adminToken) {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)/home');
      }
    } else {
      // Si no hay usuario, redirigir a la pantalla de bienvenida
      router.replace('/welcome');
    }
  }, [user, initialLoading, adminToken]);

  // Mostrar un indicador de carga mientras se determina la ruta
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f9f6', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#198754" />
    </View>
  );
}

