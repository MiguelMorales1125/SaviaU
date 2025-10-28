// Local answer keys for trivia fallback validation.
// How to use:
// - byIndex: provide an array of correct option indexes (0-based) in the same order the
//   questions are returned by getQuestions(setId).
// - byQuestionId: provide an object mapping questionId -> correctOptionId for precise matching.
// Prefer byQuestionId when you know the question and option ids; otherwise use byIndex.

import type { TriviaQuestion } from '../services/trivia';

export type LocalKey = {
  byIndex?: number[];
  byQuestionId?: Record<string, string>;
};

export const TRIVIA_LOCAL_KEYS: Record<string, LocalKey> = {
  // Example:
  // 'fundamentos-sostenibilidad': { byIndex: [1, 0, 3, 2, 1] },
  // 'cambio-climatico': { byQuestionId: { 'q-123': 'opt-a', 'q-124': 'opt-d' } },
};

// Optional: also allow mapping by set title (slugified)
export const TRIVIA_LOCAL_KEYS_BY_TITLE: Record<string, LocalKey> = {
  // Example:
  // 'fundamentos-de-sostenibilidad': { byIndex: [1, 0, 2, 3] },
  // 'cambio-climatico': { byIndex: [0, 1, 2, 3] },
  // 'consumo-responsable': { byIndex: [2, 0, 1, 3] },
  // 'energias-renovables': { byIndex: [3, 1, 0, 2] },
};

export function buildCorrectMapForQuestions(qs: TriviaQuestion[], key?: LocalKey | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!qs || qs.length === 0 || !key) return map;

  if (key.byQuestionId) {
    // Trust the provided mapping
    return { ...key.byQuestionId };
  }

  if (key.byIndex && key.byIndex.length === qs.length) {
    qs.forEach((q, i) => {
      const idx = key.byIndex![i];
      if (typeof idx === 'number' && q.options[idx]) {
        map[q.id] = q.options[idx].id;
      }
    });
  }

  return map;
}

export function slugifyTitle(title?: string): string | undefined {
  if (!title) return undefined;
  return title
    .toLowerCase()
    .normalize('NFD')
    // remove diacritics
    .replace(/\p{Diacritic}+/gu, '')
    // replace non-alphanumerics with dashes
    .replace(/[^a-z0-9]+/g, '-')
    // trim leading/trailing dashes
    .replace(/(^-|-$)/g, '');
}

export function buildCorrectMapForSet(
  setId: string,
  setTitle: string | undefined,
  questions: TriviaQuestion[]
): Record<string, string> {
  const byId = TRIVIA_LOCAL_KEYS[setId];
  let map = buildCorrectMapForQuestions(questions, byId);
  if (Object.keys(map).length > 0) return map;

  const slug = slugifyTitle(setTitle || '');
  const byTitle = slug ? TRIVIA_LOCAL_KEYS_BY_TITLE[slug] : undefined;
  map = buildCorrectMapForQuestions(questions, byTitle);
  return map;
}
