# SaviaU Mobile App 📱

Esta es la versión móvil de [SaviaU](https://saviau.com) creada con [Expo](https://expo.dev).

## ⚠️ Cambios Importantes

Esta versión móvil ha sido optimizada para funcionar correctamente en dispositivos móviles nativos (iOS y Android). Los cambios principales incluyen:

- **AsyncStorage**: Se reemplazó `localStorage` por `AsyncStorage` para almacenamiento persistente en móviles
- **Storage Service**: Nuevo servicio universal que funciona tanto en web como en móviles nativos
- **Autenticación de Admin**: Corregido el flujo de login para administradores
- **Gestión de Tokens**: Optimizada para funcionar correctamente en React Native

## Comenzar

1. **Instalar dependencias**

   ```bash
   npm install
   ```

   Esto instalará todas las dependencias incluyendo:
   - `@react-native-async-storage/async-storage` - Almacenamiento persistente
   - Expo SDK 54
   - React Native 0.81.4
   - Y todas las demás dependencias necesarias

2. Iniciar la aplicación

   ```bash
   npx expo start
   ```

En la salida, encontrarás opciones para abrir la app en:

- [Build de desarrollo](https://docs.expo.dev/develop/development-builds/introduction/)
- [Emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), un sandbox limitado para probar el desarrollo de apps con Expo

Puedes empezar a desarrollar editando los archivos dentro del directorio **app**. Este proyecto usa [file-based routing](https://docs.expo.dev/router/introduction).

## Estructura del Proyecto

```
mobile/
├── app/                    # Rutas y pantallas de la aplicación
│   ├── (auth)/            # Pantallas de autenticación
│   ├── (tabs)/            # Pantallas principales con tabs
│   └── (admin)/           # Panel de administración
├── assets/                # Imágenes y recursos estáticos
├── components/            # Componentes reutilizables
├── config/                # Configuración de la app (API, etc.)
├── constants/             # Constantes y temas
├── context/               # Contextos de React (Auth, etc.)
├── hooks/                 # Custom hooks
├── services/              # Servicios de API
└── styles/                # Estilos globales
```

## Scripts Disponibles

- `npm start` - Iniciar el servidor de desarrollo
- `npm run android` - Abrir en emulador Android
- `npm run ios` - Abrir en simulador iOS
- `npm run web` - Abrir en navegador web
- `npm run build:android` - Construir APK para Android
- `npm run build:ios` - Construir IPA para iOS

## Características

- ✅ Autenticación de usuarios
- ✅ Sistema de diagnóstico
- ✅ Trivia y retos educativos
- ✅ Gestión de temáticas
- ✅ Perfil de usuario
- ✅ Panel de administración

## Tecnologías

- **React Native** - Framework móvil
- **Expo** - Plataforma de desarrollo
- **Expo Router** - Navegación basada en archivos
- **TypeScript** - Tipado estático
- **React Native Reanimated** - Animaciones
- **Expo Image Picker** - Selección de imágenes

## Builds de Producción

Para crear builds de producción, usa [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm run build:production
```

## Aprende Más

- [Documentación de Expo](https://docs.expo.dev/)
- [Tutorial de Expo](https://docs.expo.dev/tutorial/introduction/)
- [React Native](https://reactnative.dev/)

## Comunidad

- [Expo en GitHub](https://github.com/expo/expo)
- [Discord de Expo](https://chat.expo.dev)
