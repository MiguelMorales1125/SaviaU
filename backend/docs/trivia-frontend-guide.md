# Guía rápida Frontend: consumo de APIs de Trivia y Progreso

Este archivo muestra un cliente TypeScript simple para consumir los endpoints expuestos por el backend y cómo integrarlos en un flujo de UI.

## Endpoints disponibles

- Trivia:
  - GET `/api/trivia/sets`
  - GET `/api/trivia/{setId}/questions`
  - POST `/api/trivia/start`  (body: { accessToken, setId })
  - POST `/api/trivia/answer` (body: { accessToken, attemptId, questionId, selectedOptionId })
  - POST `/api/trivia/finish` (body: { accessToken, attemptId })
  - GET `/api/trivia/result?accessToken=...&attemptId=...`
  - GET `/api/trivia/stats?accessToken=...`
- Progreso/Insignias:
  - GET `/api/progress/overview?accessToken=...`
  - GET `/api/progress/badges?accessToken=...`
  - POST `/api/progress/activity` (body: { accessToken, type, metadata })

Nota: Los endpoints de progreso registran automáticamente insignias al finalizar trivias o diagnóstico. Para noticias u otras acciones, usa `/api/progress/activity` con `type=NEWS_READ`.

---

## Cliente TypeScript de ejemplo (copiar en tu front)

```ts
// triviaClient.ts
export type TriviaSet = {
  id: string;
  title: string;
  description?: string;
  topic?: string;
};

export type TriviaQuestion = {
  id: string;
  prompt: string;
  topic?: string;
  difficulty?: string;
  options: { id: string; text: string }[];
};

export type TriviaStartRequest = { accessToken: string; setId: string };
export type TriviaStartResponse = { attemptId: string; setId: string; startedAt: string };

export type TriviaAnswerRequest = {
  accessToken: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string;
};
export type TriviaAnswerResponse = {
  attemptId: string;
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
  explanation?: string | null;
  correctOptionId?: string | null;
};

export type TriviaFinishRequest = { accessToken: string; attemptId: string };
export type TriviaResultDto = {
  attemptId: string;
  userId: string;
  setId: string;
  scorePercent: number;
  totalCorrect: number;
  totalQuestions: number;
  completedAt: string | null;
  topicBreakdown: Record<string, number>;
  recommendedTopics: string[];
};

export type TriviaStatsDto = {
  userId: string;
  totalAttempts: number;
  avgScore: number;
  bestScore: number;
  lastAttemptAt: string | null;
  totalQuestionsAnswered: number;
  totalCorrect: number;
};

export type ProgressOverviewDto = {
  stats: { triviaCompleted: number; diagnosticsCompleted: number; newsRead: number };
  topics: { topic: string; correct: number; totalAnswered: number; percent: number }[];
  badges: { id: string; code: string; name: string; description?: string; iconUrl?: string; awardedAt?: string }[];
};

export type AwardResultDto = { awarded: { id: string; code: string; name: string }[] };

export class TriviaApi {
  constructor(private baseUrl: string) {}

  async getSets(): Promise<TriviaSet[]> {
    const res = await fetch(`${this.baseUrl}/api/trivia/sets`);
    if (!res.ok) throw new Error('Error cargando sets');
    return res.json();
  }

  async getQuestions(setId: string): Promise<TriviaQuestion[]> {
    const res = await fetch(`${this.baseUrl}/api/trivia/${setId}/questions`);
    if (!res.ok) throw new Error('Error cargando preguntas');
    return res.json();
  }

  async start(req: TriviaStartRequest): Promise<TriviaStartResponse> {
    const res = await fetch(`${this.baseUrl}/api/trivia/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('No se pudo iniciar la trivia');
    return res.json();
  }

  async answer(req: TriviaAnswerRequest): Promise<TriviaAnswerResponse> {
    const res = await fetch(`${this.baseUrl}/api/trivia/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('No se pudo enviar la respuesta');
    return res.json();
  }

  async finish(req: TriviaFinishRequest): Promise<TriviaResultDto> {
    const res = await fetch(`${this.baseUrl}/api/trivia/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('No se pudo finalizar');
    return res.json();
  }

  async getResult(accessToken: string, attemptId: string): Promise<TriviaResultDto> {
    const url = new URL(`${this.baseUrl}/api/trivia/result`);
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('attemptId', attemptId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('No se pudo obtener el resultado');
    return res.json();
  }

  async getStats(accessToken: string): Promise<TriviaStatsDto> {
    const url = new URL(`${this.baseUrl}/api/trivia/stats`);
    url.searchParams.set('accessToken', accessToken);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('No se pudo obtener estadísticas');
    return res.json();
  }

  async getProgress(accessToken: string): Promise<ProgressOverviewDto> {
    const url = new URL(`${this.baseUrl}/api/progress/overview`);
    url.searchParams.set('accessToken', accessToken);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('No se pudo obtener progreso');
    return res.json();
  }

  async recordNewsRead(accessToken: string, articleId: string): Promise<AwardResultDto> {
    const res = await fetch(`${this.baseUrl}/api/progress/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, type: 'NEWS_READ', metadata: { articleId } }),
    });
    if (!res.ok) throw new Error('No se pudo registrar la lectura');
    return res.json();
  }
}
```

### Flujo de uso sugerido en la UI
1. Listar sets y permitir al usuario elegir uno: `api.getSets()`.
2. Mostrar preguntas del set: `api.getQuestions(setId)`.
3. Al comenzar: `api.start({ accessToken, setId })` -> obtienes `attemptId`.
4. Por cada pregunta: `api.answer({ accessToken, attemptId, questionId, selectedOptionId })` para feedback inmediato.
5. Al terminar: `api.finish({ accessToken, attemptId })` -> muestra resultado y recomendaciones.
6. Tablero de progreso/insignias: `api.getProgress(accessToken)`.
7. Registrar lectura de noticia: `api.recordNewsRead(accessToken, articleId)`.

Consejo: Maneja el `accessToken` desde tu flujo de autenticación (Supabase/Backend) y pásalo a los métodos.

