# API de Autenticación - SaviaU

## Endpoint de Inicio de Sesión

### POST `/api/auth/login`

Este endpoint permite a los usuarios autenticarse con su email y contraseña.

#### Solicitud

**URL**: `http://localhost:8080/api/auth/login`

**Método**: `POST`

**Content-Type**: `application/json`

**Cuerpo de la solicitud**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "v1.M2FjOWQ1OTAtZjE5Yy00...",
  "tokenType": "bearer",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "role": "authenticated",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastSignInAt": "2024-01-15T15:45:00Z"
  }
}
```

#### Respuesta de Error (401 Unauthorized)

```json
{
  "error": "Credenciales inválidas o error de autenticación"
}
```

### Configuración Requerida

Asegúrate de que las siguientes variables de entorno estén configuradas en tu archivo `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
SUPABASE_JWT_SECRET=tu_jwt_secret
```

### Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }'
```

### Ejemplo de Uso con JavaScript (Fetch)

```javascript
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (response.ok) {
      const loginData = await response.json();
      console.log('Login exitoso:', loginData);
      // Guarda el accessToken para futuras peticiones
      localStorage.setItem('accessToken', loginData.accessToken);
      return loginData;
    } else {
      console.error('Error en login:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error de red:', error);
    return null;
  }
};

// Uso
loginUser('usuario@ejemplo.com', 'contraseña123');
```

### Notas Importantes

1. **Seguridad**: El `accessToken` se debe enviar en las cabeceras de las futuras peticiones autenticadas como `Authorization: Bearer {accessToken}`

2. **Expiración**: El token tiene un tiempo de vida limitado (especificado en `expiresIn` en segundos)

3. **Refresh Token**: Usa el `refreshToken` para obtener un nuevo `accessToken` cuando expire

4. **CORS**: El endpoint está configurado para aceptar peticiones desde cualquier origen (`@CrossOrigin(origins = "*")`)

### Para Ejecutar el Servidor

```bash
cd backend
./mvnw.cmd spring-boot:run
```

El servidor estará disponible en `http://localhost:8080`