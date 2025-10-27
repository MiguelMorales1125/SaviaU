# Prueba diagnóstica - Guía para Frontend

Este documento explica:
- Esquema de base de datos (tablas/relaciones) y campos nuevos en `usuarios`.
- Endpoints del backend para el diagnóstico: contratos de entrada/salida.
- Ejemplos de uso desde el frontend (TypeScript + fetch).
- Flujo recomendado para mostrar la prueba obligatoria en el primer inicio de sesión.

Backend base (por defecto): http://localhost:8080

## 1) Esquema de Base de Datos (SQL)
Consulta el archivo `docs/diagnostic-schema.sql` (incluido en este repo) que contiene:
- Alter de `public.usuarios` para agregar estos campos:
  - `has_completed_diagnostic boolean default false`
  - `diagnostic_level text`
  - `diagnostic_completed_at timestamptz`
- Tablas del diagnóstico:
  - `public.diagnostic_questions` (preguntas)
  - `public.diagnostic_options` (opciones de respuesta, con flag `is_correct`)
  - `public.diagnostic_attempts` (intentos por usuario)
  - `public.diagnostic_answers` (respuestas por intento)
- Claves/relaciones:
  - `diagnostic_options.question_id -> diagnostic_questions.id`
  - `diagnostic_attempts.user_id -> auth.users.id`
  - `diagnostic_answers.attempt_id -> diagnostic_attempts.id`
  - `diagnostic_answers.question_id -> diagnostic_questions.id`
  - `diagnostic_answers.selected_option_id -> diagnostic_options.id`
- Índices útiles e indicaciones sobre RLS (si usas Service Role desde el backend, puedes mantener RLS desactivado para estas tablas o crear policies ad-hoc).

## 2) Endpoints del Backend (contratos)
El backend usa Supabase Auth. Para atar los datos al usuario, enviamos `accessToken` (de Supabase) en algunos endpoints.

- GET `/api/diagnostic/questions`
  - Respuesta: `DiagnosticQuestionDto[]`
    - id: string (UUID)
    - prompt: string
    - topic: string
    - difficulty?: string
    - options: Array<{ id: string; text: string }>

- GET `/api/diagnostic/status?accessToken=...`
  - Query params:
    - accessToken: string (Supabase `access_token` del usuario actual)
  - Respuesta (ejemplo): `{ completed: boolean, level?: string, completedAt?: string }`

- POST `/api/diagnostic/submit`
  - Body `DiagnosticSubmitRequest`:
    - accessToken: string (Supabase `access_token`)
    - answers: Array<{ questionId: string; optionId: string }>
  - Respuesta `DiagnosticResultDto`:
    - userId: string
    - scorePercent: number (0-100)
    - level: 'Beginner' | 'Intermediate' | 'Advanced'
    - recommendedTopics: string[]
    - topicBreakdown: Record<string, number> (tema -> aciertos)
    - totalCorrect: number
    - totalQuestions: number
    - completedAt: string (ISO)

- GET `/api/diagnostic/result?accessToken=...`
  - Query params:
    - accessToken: string (Supabase `access_token`)
  - Respuesta `DiagnosticResultDto` (último intento del usuario)

## 3) Flujo recomendado (primer login obligatorio)
1) Tras login/registro exitoso obtienes el `access_token` de Supabase (ya sea por email+password o Google).
2) Llama a `GET /api/diagnostic/status?accessToken=...`.
3) Si `completed === false`, muestra la prueba (carga preguntas) y bloquea el acceso al resto de la app hasta enviarla.
4) Al enviar, usa `POST /api/diagnostic/submit` con `accessToken` y `answers`.
5) Muestra el resumen devuelto (puntaje, nivel, recomendaciones) y registra en tu estado que ya completó.

## 4) Ejemplos Frontend (TypeScript + fetch)

Base:
```ts
const API = 'http://localhost:8080/api';
```

- Cargar estado del diagnóstico:
```ts
async function fetchDiagnosticStatus(accessToken: string) {
  const res = await fetch(`${API}/diagnostic/status?accessToken=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error('No se pudo obtener el estado');
  return res.json() as Promise<{ completed: boolean; level?: string; completedAt?: string }>;
}
```

- Cargar preguntas:
```ts
type Question = {
  id: string;
  prompt: string;
  topic: string;
  difficulty?: string;
  options: { id: string; text: string }[];
};

async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${API}/diagnostic/questions`);
  if (!res.ok) throw new Error('No se pudieron cargar preguntas');
  return res.json();
}
```

- Enviar respuestas:
```ts
type SubmitPayload = {
  accessToken: string;
  answers: { questionId: string; optionId: string }[];
};

async function submitDiagnostic(payload: SubmitPayload) {
  const res = await fetch(`${API}/diagnostic/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo enviar el diagnóstico');
  return res.json() as Promise<{
    userId: string;
    scorePercent: number;
    level: string;
    recommendedTopics: string[];
    topicBreakdown: Record<string, number>;
    totalCorrect: number;
    totalQuestions: number;
    completedAt: string;
  }>;
}
```

- Obtener último resultado:
```ts
async function fetchLastResult(accessToken: string) {
  const res = await fetch(`${API}/diagnostic/result?accessToken=${encodeURIComponent(accessToken)}`);
  if (!res.ok) throw new Error('No hay intento previo');
  return res.json();
}
```

### Ejemplo de integración en la pantalla de inicio
```ts
async function onAfterLogin(accessToken: string) {
  const st = await fetchDiagnosticStatus(accessToken);
  if (!st.completed) {
    // Redirige a tu ruta interna de diagnóstico o muestra un modal/fullscreen
    // 1) Carga preguntas
    const questions = await fetchQuestions();
    // 2) Renderiza UI de selección (radio buttons)
    // 3) Al enviar, construye answers: { questionId, optionId }
    // 4) Llama a submitDiagnostic({ accessToken, answers })
  } else {
    // Continúa normal a la app
  }
}
```

## 5) Frontend estático de prueba (opcional)
Puedes abrir `http://localhost:8080/diagnostic` para una página simple (`resources/static/diagnostic.html`) que:
- Te deja pegar el `access_token` de Supabase.
- Ver el estado (`/diagnostic/status`).
- Cargar preguntas (`/diagnostic/questions`).
- Enviar respuestas (`/diagnostic/submit`) y ver el resumen.

## 6) Notas y buenas prácticas
- En Supabase Dashboard añade tus rutas del front en Allowed Redirect URLs.
- Asegúrate de poblar la tabla `diagnostic_questions` y `diagnostic_options` con preguntas y marcar `is_correct` donde corresponda.
- Para entornos de producción, usa HTTPS y configura CORS en tu API Gateway/web server si lo necesitas.
- El backend usa la Service Role Key para leer/escribir en las tablas del diagnóstico. Mantén esa clave segura y solo en el backend.
- Si quieres permitir a los usuarios ver sus intentos desde el cliente usando la anon key, deberás habilitar RLS con policies específicas. Por ahora, todo pasa por el backend.

