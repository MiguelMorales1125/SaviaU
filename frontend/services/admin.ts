import { API_CONFIG, getApiUrl } from '../config/api';
import { TematicaArea, TematicaAreaSummary, TematicaResource } from './tematicas';

export type AdminTriviaSet = {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  questionCount?: number;
  active?: boolean;
};

export type AdminTriviaOption = {
  id?: string;
  questionId?: string;
  text: string;
  correct: boolean;
  explanation?: string;
};

export type AdminTriviaQuestion = {
  id: string;
  setId: string;
  prompt: string;
  topic?: string;
  difficulty?: string;
  active: boolean;
  options: AdminTriviaOption[];
};

export type AdminLeaderboardRow = {
  userId: string;
  fullName?: string;
  email?: string;
  avgScore: number;
  bestScore: number;
  attempts: number;
};

export type AdminUserProgress = {
  userId: string;
  fullName?: string;
  email?: string;
  totalAttempts: number;
  avgScore: number;
  bestScore: number;
  accuracy: number;
  lastAttemptAt?: string | null;
};

export type AdminTriviaSetPayload = {
  id?: string;
  title: string;
  description?: string;
  topic?: string;
  active?: boolean;
};

export type AdminTriviaQuestionPayload = {
  setId: string;
  questionId?: string;
  prompt: string;
  topic?: string;
  difficulty?: string;
  active?: boolean;
  options: AdminTriviaOption[];
};

export type AdminTematicaAreaPayload = {
  id?: string;
  name: string;
  summary?: string;
  accentColor?: string;
  heroImage?: string;
  tagline?: string;
  learningFocus?: string[];
};

export type AdminTematicaResourcePayload = {
  id?: string;
  areaId: string;
  title: string;
  shortDescription?: string;
  detailDescription?: string;
  imageUrl?: string;
  format?: string;
  estimatedTime?: string;
  funFact?: string;
  deepDive?: string;
  highlighted?: boolean;
  sources?: string[];
};

const buildHeaders = (token: string, extra?: Record<string, string>) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  ...extra,
});

async function adminFetch<T>(endpoint: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(endpoint), {
    ...init,
    headers: {
      ...buildHeaders(token),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = 'Error al contactar el backend';
    try {
      const data = await response.json();
      if (typeof data === 'string') {
        message = data;
      } else if (data?.message) {
        message = data.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const adminTriviaApi = {
  fetchSets: (token: string) => adminFetch<AdminTriviaSet[]>(API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_SETS, token),
  saveSet: (token: string, payload: AdminTriviaSetPayload) =>
    adminFetch<AdminTriviaSet>(API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_SETS, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  fetchQuestions: (token: string, setId?: string) =>
    adminFetch<AdminTriviaQuestion[]>(
      `${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_QUESTIONS}${setId ? `?setId=${encodeURIComponent(setId)}` : ''}`,
      token,
    ),
  createQuestion: (token: string, payload: AdminTriviaQuestionPayload) =>
    adminFetch<AdminTriviaQuestion>(API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_QUESTIONS, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateQuestion: (token: string, questionId: string, payload: AdminTriviaQuestionPayload) =>
    adminFetch<AdminTriviaQuestion>(`${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_QUESTIONS}/${questionId}`, token, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteQuestion: (token: string, questionId: string) =>
    adminFetch<void>(`${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_QUESTIONS}/${questionId}`, token, {
      method: 'DELETE',
    }),
  fetchLeaderboard: (token: string, limit = 15) =>
    adminFetch<AdminLeaderboardRow[]>(`${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_LEADERBOARD}?limit=${limit}`, token),
  fetchCohortProgress: (token: string, limit = 30) =>
    adminFetch<AdminUserProgress[]>(`${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_PROGRESS}?limit=${limit}`, token),
  fetchUserProgress: (token: string, userId: string) =>
    adminFetch<AdminUserProgress>(`${API_CONFIG.ENDPOINTS.ADMIN_TRIVIA_PROGRESS}/${userId}`, token),
  fetchTematicaAreas: (token: string) =>
    adminFetch<TematicaAreaSummary[]>(API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_AREAS, token),
  fetchTematicaArea: (token: string, areaId: string) =>
    adminFetch<TematicaArea>(`${API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_AREAS}/${areaId}`, token),
  saveTematicaArea: (token: string, payload: AdminTematicaAreaPayload) =>
    adminFetch<TematicaArea>(API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_AREAS, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTematicaArea: (token: string, areaId: string) =>
    adminFetch<void>(`${API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_AREAS}/${areaId}`, token, {
      method: 'DELETE',
    }),
  saveTematicaResource: (token: string, payload: AdminTematicaResourcePayload) =>
    adminFetch<TematicaResource>(API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_RESOURCES, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteTematicaResource: (token: string, resourceId: string) =>
    adminFetch<void>(`${API_CONFIG.ENDPOINTS.ADMIN_TEMATICAS_RESOURCES}/${resourceId}`, token, {
      method: 'DELETE',
    }),
};
