# Demo de Integración Frontend-Backend - SaviaU

## 🚀 Prueba del Endpoint de Login

### Paso 1: Iniciar el Backend

1. Abre una terminal y navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Ejecuta el servidor Spring Boot:
   ```bash
   ./mvnw.cmd spring-boot:run
   ```

3. Verifica que el servidor esté funcionando visitando:
   ```
   http://localhost:8080/api/health
   ```

### Paso 2: Iniciar el Frontend

1. Abre otra terminal y navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

4. Elige tu plataforma:
   - **Web**: Presiona `w` para abrir en el navegador
   - **Android**: Presiona `a` (requiere Android Studio/emulador)
   - **iOS**: Presiona `i` (requiere Xcode/simulador, solo macOS)

### Paso 3: Probar la Integración

1. **En la pantalla principal**, verás un botón "🔐 Ir a Login"

2. **Toca el botón** para navegar a la pantalla de login

3. **En la pantalla de login**:
   - Toca "Probar Conexión al Servidor" para verificar que el backend está funcionando
   - Ingresa credenciales de prueba (email y contraseña)
   - Toca "Iniciar Sesión"

### 📱 Funcionalidades Implementadas

#### Backend (Spring Boot)
- ✅ Endpoint `POST /api/auth/login`
- ✅ DTOs: `LoginRequest` y `LoginResponse`
- ✅ Servicio de autenticación con Supabase
- ✅ Manejo de errores y respuestas HTTP

#### Frontend (React Native/Expo)
- ✅ Servicio de autenticación (`authService.ts`)
- ✅ Pantalla de login con formulario
- ✅ Navegación integrada
- ✅ Botón de prueba de conexión
- ✅ Manejo de estados de carga y errores

### 🔧 Características del Demo

1. **Validación de Conexión**: Botón para probar que el servidor backend esté funcionando

2. **Formulario de Login**: Campos para email y contraseña con validaciones básicas

3. **Manejo de Estados**: 
   - Loading durante el login
   - Mensajes de error claros
   - Confirmación de login exitoso

4. **Almacenamiento Local**: 
   - Tokens guardados en localStorage (web)
   - Información del usuario persistida

5. **Navegación**: 
   - Botón en pantalla principal para acceder al login
   - Redirección después del login exitoso

### 🐛 Troubleshooting

#### Error de Conexión
- Verifica que el backend esté ejecutándose en `http://localhost:8080`
- Revisa que las variables de entorno estén configuradas en `.env`
- Asegúrate de que no haya firewalls bloqueando el puerto 8080

#### Error de CORS (en web)
- El backend ya tiene CORS habilitado con `@CrossOrigin(origins = "*")`
- Si persiste, verifica la configuración en `SupabaseController.java`

#### Error 401 - Credenciales Inválidas
- Verifica que tengas usuarios registrados en tu base de datos Supabase
- O crea usuarios de prueba usando la consola de Supabase

### 📖 Archivos Importantes

#### Backend
- `SupabaseController.java` - Endpoint de login
- `SupabaseService.java` - Lógica de autenticación
- `LoginRequest.java` / `LoginResponse.java` - DTOs
- `application.properties` - Configuración

#### Frontend
- `services/authService.ts` - Servicio de autenticación
- `app/login.tsx` - Pantalla de login
- `app/(tabs)/index.tsx` - Pantalla principal con botón de acceso

### 🎯 Próximos Pasos

1. **Registro de Usuarios**: Crear endpoint y pantalla para registro
2. **Persistencia Mejorada**: Usar AsyncStorage en lugar de localStorage
3. **Validaciones**: Agregar validación de email y contraseña más robusta
4. **Refresh Token**: Implementar renovación automática de tokens
5. **Logout**: Funcionalidad completa de cierre de sesión

¡La integración está lista para probar! 🎉