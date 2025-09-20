import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Oculta el header en todas las pantallas de /auth
      }}
    />
  );
}