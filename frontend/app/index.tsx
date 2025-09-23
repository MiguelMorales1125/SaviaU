import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, initialLoading } = useAuth();

  useEffect(() => {
    console.log('Index - Estado actual:', { user: !!user, initialLoading });
    
    if (!initialLoading) {
      if (user) {
        console.log('Usuario encontrado, redirigiendo a tabs');
        router.replace('../(tabs)');
      } else {
        console.log('No hay usuario, redirigiendo a login');
        router.replace('/(auth)/login');
      }
    }
  }, [user, initialLoading]);

  
  return null;
}
