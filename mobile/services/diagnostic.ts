import { getApiUrl } from '../config/api';

export async function fetchDiagnosticStatus(accessToken: string) {
  const res = await fetch(getApiUrl(`/api/diagnostic/status?accessToken=${encodeURIComponent(accessToken)}`));
  if (!res.ok) throw new Error('No se pudo obtener el estado del diagnóstico');
  return res.json() as Promise<{ completed: boolean; level?: string; completedAt?: string }>;
}

export type Question = {
  id: string;
  prompt: string;
  topic: string;
  difficulty?: string;
  options: { id: string; text: string }[];
};

export async function fetchQuestions(): Promise<Question[]> {
  // Retry a few times for transient 5xx errors
  const maxAttempts = 3;
  let attempt = 0;
  let lastErr: any = null;
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await fetch(getApiUrl('/api/diagnostic/questions'));
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch (e) { /* ignore */ }
        const msg = `Failed to fetch questions: ${res.status} ${res.statusText} ${body}`;
        // If server error, retry a couple times
        if (res.status >= 500 && attempt < maxAttempts) {
          console.warn(`${msg} - retrying (${attempt}/${maxAttempts})`);
          await sleep(500 * attempt);
          continue;
        }
        console.error(msg);
        throw new Error(msg);
      }

      const data = await res.json();
  // If backend returns null/empty array treat explicitly
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('fetchQuestions: backend returned empty questions array');
      }
      return data as Promise<Question[]>;
    } catch (err) {
      lastErr = err;
      // if last attempt, throw
      if (attempt >= maxAttempts) {
        console.error('fetchQuestions final error', err);
        throw err;
      }
      // small backoff before retry
      await sleep(300 * attempt);
    }
  }
  throw lastErr || new Error('Unknown error fetching questions');
}

export type SubmitPayload = {
  accessToken: string;
  answers: { questionId: string; optionId: string }[];
};

export async function submitDiagnostic(payload: SubmitPayload) {
  const res = await fetch(getApiUrl('/api/diagnostic/submit'), {
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

export async function fetchLastResult(accessToken: string) {
  const res = await fetch(getApiUrl(`/api/diagnostic/result?accessToken=${encodeURIComponent(accessToken)}`));
  if (!res.ok) throw new Error('No hay intento previo');
  return res.json();
}
