# Cambios Realizados para Soporte Móvil - Login de Admin

## Problema Original
El login de administrador no funcionaba en la versión móvil porque:
1. Se usaba `localStorage` que no existe en React Native
2. No había manejo de AsyncStorage para dispositivos móviles
3. La navegación no verificaba correctamente el adminToken

## Soluciones Implementadas

### 1. Nuevo Storage Service (`services/storage.ts`)
- Servicio universal que detecta la plataforma (web vs móvil)
- Usa `localStorage` en web y `AsyncStorage` en React Native
- API asíncrona compatible con ambas plataformas

```typescript
// Uso:
await storage.setItem('key', 'value');
const value = await storage.getItem('key');
await storage.removeItem('key');
```

### 2. AuthContext Optimizado
- Reemplazadas TODAS las referencias a `localStorage` por `storage`
- Todas las operaciones de storage ahora son asíncronas
- Mejor manejo de errores y logs para debugging
- Detección mejorada de admin token en el login

### 3. Login Component Actualizado
- Importa y usa el storage service
- Accede al `adminToken` del contexto de autenticación
- Verifica múltiples fuentes para determinar si es admin:
  - `data.adminToken` de la respuesta
  - `adminToken` del contexto
  - `data.user.role` del usuario
- Navegación correcta: `/(admin)` para admins, `/(tabs)/home` para usuarios

### 4. Dependencias Agregadas
```json
{
  "@react-native-async-storage/async-storage": "^2.1.0"
}
```

## Archivos Modificados

1. **`mobile/package.json`** - Agregada dependencia de AsyncStorage
2. **`mobile/services/storage.ts`** - Nuevo servicio de storage universal
3. **`mobile/context/AuthContext.tsx`** - Reescrito para usar storage async
4. **`mobile/app/(auth)/login.tsx`** - Actualizado para detectar admin correctamente
5. **`mobile/README.md`** - Documentación actualizada

## Flujo de Login para Admin

1. Usuario ingresa credenciales de admin
2. Se llama a `/api/auth/login`
3. Si la respuesta no incluye `adminToken`, se intenta `/api/admin/auth/login`
4. El `adminToken` se guarda en AsyncStorage
5. El flag `diagnosticCompleted` se marca como `true` para admins
6. La navegación redirige a `/(admin)` si se detecta admin
7. El `AuthGate` en `_layout.tsx` mantiene a los admins en el panel admin

## Testing

Para probar:
1. Instalar dependencias: `npm install`
2. Iniciar Expo: `npx expo start`
3. Abrir en dispositivo móvil (Android/iOS) con Expo Go
4. Hacer login con credenciales de admin
5. Verificar que navega a `/(admin)` y no a `/(tabs)/home`

## Logs de Debug

El sistema ahora incluye logs detallados:
- `[Auth] Hydrate profile` - Al cargar perfil del backend
- `Admin token recibido` - Cuando se detecta admin
- `Usuario verificado como admin` - Tras verificación exitosa
- `Navegando a panel de admin` - Antes de navegar

Revisar la consola de Metro/Expo para estos logs durante el login.
