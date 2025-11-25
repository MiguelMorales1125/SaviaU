import { getApiUrl } from '../config/api';

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

export class TriviaApi {
  async getSets(): Promise<TriviaSet[]> {
    const res = await fetch(getApiUrl('/api/trivia/sets'));
    if (!res.ok) throw new Error('Error cargando sets');
    const data = await res.json();
    console.log('📚 Sets cargados:', data);
    return data;
  }

  async getQuestions(setId: string): Promise<TriviaQuestion[]> {
    const res = await fetch(getApiUrl(`/api/trivia/${setId}/questions`));
    if (!res.ok) throw new Error('Error cargando preguntas');
    const data = await res.json();
    console.log('❓ Preguntas cargadas:', data);
    return data;
  }

  async start(req: TriviaStartRequest): Promise<TriviaStartResponse> {
    console.log('🚀 Iniciando intento con:', req);
    const res = await fetch(getApiUrl('/api/trivia/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('No se pudo iniciar la trivia');
    const data = await res.json();
    console.log('✅ Intento iniciado:', data);
    return data;
  }

  async answer(req: TriviaAnswerRequest): Promise<TriviaAnswerResponse> {
    console.log('🟡 Enviando respuesta al backend:', req);

    const res = await fetch(getApiUrl('/api/trivia/answer'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      console.error('❌ Error HTTP al enviar la respuesta:', res.status, res.statusText);
      let message = 'No se pudo enviar la respuesta';
      try {
        const payload = await res.json();
        if (payload?.message) message = payload.message;
      } catch (_) {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch (_) {}
      }
      throw new Error(message);
    }

    const data = await res.json();
    console.log('📩 Respuesta del backend (answer):', data);

    return data;
  }

  async finish(req: TriviaFinishRequest): Promise<TriviaResultDto> {
    console.log('🏁 Finalizando intento:', req);
    const res = await fetch(getApiUrl('/api/trivia/finish'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('No se pudo finalizar');
    const data = await res.json();
    console.log('🎯 Resultado final del intento:', data);
    return data;
  }

  async getResult(accessToken: string, attemptId: string): Promise<TriviaResultDto> {
    const url = new URL(getApiUrl('/api/trivia/result'));
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('attemptId', attemptId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('No se pudo obtener el resultado');
    const data = await res.json();
    console.log('📊 Resultado obtenido:', data);
    return data;
  }

  async getStats(accessToken: string): Promise<TriviaStatsDto> {
    const url = new URL(getApiUrl('/api/trivia/stats'));
    url.searchParams.set('accessToken', accessToken);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('No se pudo obtener estadísticas');
    const data = await res.json();
    console.log('📈 Estadísticas del usuario:', data);
    return data;
  }
}

export const triviaApi = new TriviaApi();
