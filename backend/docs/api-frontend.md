# Guía: Cómo usar los endpoints del backend desde el frontend

Base del backend (por defecto): http://localhost:8080
Ajusta el host/puerto según despliegue.

Importante
- El backend NO asume rutas del frontend. Tú debes pasar tus URLs en los parámetros redirectTo (Google) y redirectUri (reset password).
- En Supabase, agrega en Authentication > URL Configuration las URLs exactas del frontend a donde vas a redirigir (Allowed Redirect URLs).

Estructuras de datos
- LoginRequest: { email: string, password: string }
- RegisterRequest: { fullName: string, email: string, password: string, carrera: string, universidad: string, semestre: number }
- GoogleFinishRequest: { accessToken: string, refreshToken?: string }
- PasswordResetRequest: { email: string, redirectUri?: string }
- PasswordApplyRequest: { accessToken: string, newPassword: string }
- OnboardRequest: { accessToken: string, fullName: string, carrera: string, universidad: string, semestre: number }
- LoginResponse: {
  accessToken?: string,
  refreshToken?: string,
  tokenType?: string,
  expiresIn?: number,
  user?: { id?: string, email?: string, role?: string, createdAt?: string, lastSignInAt?: string },
  appToken?: string // JWT propio de la app (HS256)
}

1) Registro (email/contraseña)
POST /api/auth/register
Body (RegisterRequest)

```ts
const res = await fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'Nombre Apellido',
    email: 'usuario@example.com',
    password: 'TuPasswordSeguro1',
    carrera: 'Ingeniería',
    universidad: 'Mi Universidad',
    semestre: 3,
  }),
});
if (!res.ok) throw new Error('Registro falló');
const data: LoginResponse = await res.json();
// data.appToken: JWT propio para tu app
```

2) Login (email/contraseña)
POST /api/auth/login
Body (LoginRequest)

```ts
const res = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usuario@example.com', password: 'TuPasswordSeguro1' }),
});
if (!res.ok) throw new Error('Login falló');
const data: LoginResponse = await res.json();
```

3) Google OAuth (inicio)
GET /api/auth/google/url?redirectTo=URL_ABSOLUTA_FRONT
- redirectTo DEBE ser una URL absoluta del frontend donde procesarás el hash de Supabase (por ejemplo, https://tu-front.com/(auth)/oauth).
- Respuesta: { url: string } (la URL a la que debes redirigir al usuario).

```ts
const redirectTo = 'http://localhost:3000/(auth)/oauth';
const res = await fetch('http://localhost:8080/api/auth/google/url?redirectTo=' + encodeURIComponent(redirectTo));
if (!res.ok) throw new Error('No se pudo obtener la URL de Google');
const { url } = await res.json();
window.location.href = url; // redirige al proveedor
```

4) Google OAuth (finalización en tu front)
Tu página del front (p.ej. /(auth)/oauth) recibirá en location.hash los tokens de Supabase: #access_token=...&refresh_token=...
1) Parsea el hash.
2) Llama al backend para finalizar sesión y obtener appToken.

```ts
function parseHash(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  return Object.fromEntries(new URLSearchParams(h));
}

const { access_token, refresh_token } = parseHash(window.location.hash);
if (!access_token) throw new Error('Falta access_token en el hash');

const res = await fetch('http://localhost:8080/api/auth/google/finish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accessToken: access_token, refreshToken: refresh_token }),
});
if (!res.ok) throw new Error('No se pudo finalizar login con Google');
const data: LoginResponse = await res.json();
// Guarda data.appToken y navega a tu app
```

5) Olvidé mi contraseña (enviar correo)
POST /api/auth/password/reset
- Body: { email, redirectUri }
- redirectUri: la URL ABSOLUTA a una página del front (p.ej. https://tu-front.com/(auth)/reset) donde leerás el access_token del hash.

```ts
const res = await fetch('http://localhost:8080/api/auth/password/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    redirectUri: 'http://localhost:3000/(auth)/reset',
  }),
});
if (!res.ok) throw new Error('No se pudo solicitar el correo de recuperación');
```

6) Aplicar nueva contraseña (en tu front)
Tu página (/(auth)/reset) recibe #access_token=...
1) Parsea access_token.
2) Envía la nueva contraseña al backend.

```ts
const { access_token } = parseHash(window.location.hash);
if (!access_token) throw new Error('Falta access_token en el hash');

const res = await fetch('http://localhost:8080/api/auth/password/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accessToken: access_token, newPassword: 'NuevaPasswordSegura1' }),
});
if (!res.ok) throw new Error('No se pudo actualizar la contraseña');
```

7) Completar/actualizar perfil (onboarding)
Tras login (por Google o email), puedes completar o actualizar datos del perfil con el access_token de Supabase (no confundir con appToken):

POST /api/auth/onboard
Body (OnboardRequest)

```ts
const res = await fetch('http://localhost:8080/api/auth/onboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken, // token de Supabase (no el appToken)
    fullName: 'Nombre Apellido',
    carrera: 'Ingeniería',
    universidad: 'Mi Universidad',
    semestre: 3,
  }),
});
if (!res.ok) throw new Error('No se pudo completar el perfil');
```

7.1) Obtener perfil guardado (para precargar en el front)
GET /api/auth/profile?accessToken=...  → devuelve el perfil persistido en la tabla `usuarios`.

Respuesta ejemplo:
```json
{
  "userId": "uuid-del-usuario",
  "email": "usuario@example.com",
  "exists": true,
  "profile": {
    "fullName": "Nombre Apellido",
    "carrera": "Ingeniería",
    "universidad": "Mi Universidad",
    "semestre": 3
  }
}
```

Uso desde el frontend:
```ts
const res = await fetch('http://localhost:8080/api/auth/profile?accessToken=' + encodeURIComponent(access_token));
if (!res.ok) throw new Error('No se pudo obtener el perfil');
const data = await res.json();
if (data.exists && data.profile) {
  // precarga los campos
}
```

7.2) Estado del perfil (saber si falta algo por completar)
GET /api/auth/profile/status?accessToken=...

Respuesta ejemplo (incompleto):
```json
{
  "userId": "uuid-del-usuario",
  "email": "usuario@example.com",
  "exists": true,
  "complete": false,
  "isNewUser": false,
  "missingFields": ["universidad"]
}
```

Notas y buenas prácticas
- redirectTo y redirectUri deben ser URLs absolutas y deben estar listadas en "Allowed Redirect URLs" en Supabase.
- Usa HTTPS en producción.
- Guarda tokens de forma segura (ej. cookies httpOnly para tu appToken si controlas un backend BFF; localStorage solo si aceptas su modelo de riesgo).
- Evita loggear el access_token y considera no incluirlo en URLs en producción (usa POST o Authorization header si cambias el contrato).
- Maneja errores: verifica `res.ok` y muestra mensajes claros.
- CORS: el backend permite orígenes con `@CrossOrigin("*")` para desarrollo. Configura políticas más estrictas en producción.
- Si ves "Whitelabel Error Page", casi siempre es porque se navegó a una ruta del backend que no tiene vista o la URL de retorno no está permitida en Supabase.

Apéndice: helper para parsear el hash de Supabase

```ts
export function parseSupabaseHash(): { access_token?: string; refresh_token?: string; [k: string]: string | undefined } {
  const h = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(h);
  const result: Record<string, string> = {};
  params.forEach((v, k) => (result[k] = v));
  return result as any;
}
```
