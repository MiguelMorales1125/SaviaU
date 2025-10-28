import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { retosStyles as styles } from '../../styles/retos.styles';
import { triviaApi, TriviaQuestion, TriviaSet } from '../../services/trivia';
import { useAuth } from '../../context/AuthContext';
import { buildCorrectMapForSet } from '../../constants/triviaLocalKeys';

type AnswerState = {
  selectedOptionId: string | null;
  correctOptionId?: string | null;
  correct?: boolean;
  explanation?: string | null;
};

export default function Retos() {
  const { supabaseAccessToken } = useAuth();

  // Carga de sets y selección
  const [loadingSets, setLoadingSets] = useState(true);
  const [sets, setSets] = useState<TriviaSet[]>([]);
  const [setError, setSetError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<TriviaSet | null>(null);

  // Preguntas y respuestas
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>({ selectedOptionId: null });
  const [localCorrectMap, setLocalCorrectMap] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Resultado final
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // 1) Cargar sets al entrar
  useEffect(() => {
    (async () => {
      try {
        setLoadingSets(true);
        const data = await triviaApi.getSets();
        setSets(data);
      } catch (e: any) {
        setSetError(e?.message || 'No se pudo cargar los retos');
      } finally {
        setLoadingSets(false);
      }
    })();
  }, []);

  // 2) Al seleccionar un set, traer preguntas (sin revelar correctas)
  const loadQuestions = async (s: TriviaSet) => {
    try {
      const qs = await triviaApi.getQuestions(s.id);
      // Log de apoyo para definir claves locales fácilmente en consola
      try {
        console.log('[TRIVIA] setId:', s.id);
        console.table(qs.map((q, i) => ({ i, qId: q.id, prompt: q.prompt, optionIds: q.options.map(o => o.id) })));
      } catch {}
      setQuestions(qs);
      setTotalQuestions(qs.length);
      setQIndex(0);
      setAnswerState({ selectedOptionId: null });
      setSelectedSet(s);
  // construir mapa de respuestas correctas localmente si hay claves configuradas (por id o por título)
  setLocalCorrectMap(buildCorrectMapForSet(s.id, s.title, qs));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar las preguntas');
    }
  };

  // 3) Iniciar intento cuando el usuario esté listo
  const startAttempt = async () => {
    if (!selectedSet) return;
    if (!supabaseAccessToken) {
      Alert.alert('Inicia sesión', 'Necesitas iniciar sesión para responder el quiz.');
      return;
    }
    try {
      setStarting(true);
      const resp = await triviaApi.start({ accessToken: supabaseAccessToken, setId: selectedSet.id });
      setAttemptId(resp.attemptId);
      setScore(0);
    } catch (e: any) {
      Alert.alert('No se pudo iniciar', e?.message || 'Intenta nuevamente');
    } finally {
      setStarting(false);
    }
  };

  // 4) Responder una pregunta
  const currentQuestion = useMemo(() => questions[qIndex], [questions, qIndex]);
  const onSelectOption = async (optionId: string) => {
    if (!currentQuestion) return;
    if (answerState.selectedOptionId) return; // evita múltiples taps
    setAnswerState({ selectedOptionId: optionId });
    // Si hay clave local, validar en el front (no dependemos del backend)
    const localCorrectId = localCorrectMap[currentQuestion.id];
    if (localCorrectId) {
      const isOk = localCorrectId === optionId;
      setAnswerState({
        selectedOptionId: optionId,
        correctOptionId: localCorrectId,
        correct: isOk,
        explanation: isOk ? '¡Correcto!' : 'Respuesta incorrecta',
      });
      if (isOk) setScore((s) => s + 1);
      return;
    }

    // Fallback: intentar backend si tenemos intento/tokens
    if (!attemptId || !supabaseAccessToken) {
      // Sin intento ni token, no podemos validar — registra selección sin feedback fuerte
      setAnswerState({ selectedOptionId: optionId, correct: undefined, correctOptionId: undefined });
      return;
    }

    try {
      setAnswering(true);
      const resp = await triviaApi.answer({ accessToken: supabaseAccessToken, attemptId, questionId: currentQuestion.id, selectedOptionId: optionId });
      const isActuallyCorrect = Boolean(resp.correct || (resp.correctOptionId && resp.correctOptionId === optionId));
      setAnswerState({ selectedOptionId: optionId, correctOptionId: resp.correctOptionId ?? undefined, correct: isActuallyCorrect, explanation: resp.explanation ?? undefined });
      if (isActuallyCorrect) setScore((s) => s + 1);
    } catch (e: any) {
      // Si el backend falla, nos quedamos sin validación
      setAnswerState({ selectedOptionId: optionId, correct: undefined, correctOptionId: undefined });
    } finally {
      setAnswering(false);
    }
  };

  // 5) Siguiente / Finalizar
  const nextOrFinish = async () => {
    if (!currentQuestion) return;
    const isLast = qIndex >= questions.length - 1;
    if (!isLast) {
      setQIndex((i) => i + 1);
      setAnswerState({ selectedOptionId: null });
      return;
    }
    // finalizar
    if (!attemptId || !supabaseAccessToken) {
      // Si por alguna razón no hay attempt/token, mostramos resultado local básico
      setShowResult(true);
      return;
    }
    try {
      setFinishing(true);
      await triviaApi.finish({ accessToken: supabaseAccessToken, attemptId });
      setShowResult(true);
    } catch (e: any) {
      // Muestra aun así el resultado local
      setShowResult(true);
    } finally {
      setFinishing(false);
    }
  };

  // 6) UI de sets (listado para elegir)
  if (!selectedSet) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={styles.question}>Retos disponibles</Text>
            {loadingSets ? (
              <ActivityIndicator />
            ) : setError ? (
              <Text style={{ color: '#842029', fontWeight: '700' }}>{setError}</Text>
            ) : sets.length === 0 ? (
              <Text>No hay retos disponibles por ahora.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {sets.map((s) => (
                  <TouchableOpacity key={s.id} style={[styles.optionBtn, styles.option]} onPress={() => loadQuestions(s)}>
                    <Text style={styles.optionText}>{s.title}</Text>
                    {s.description ? (
                      <Text style={{ color: '#6c757d', marginTop: 4 }}>{s.description}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  // 7) Resultado final
  if (showResult) {
    const pct = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
    let bannerText = '¡Sigue practicando!';
    let bannerColor = '#c0353a';
    if (pct === 100) { bannerText = '¡PERFECTO!'; bannerColor = '#198754'; }
    else if (pct >= 75) { bannerText = '¡Muy bien!'; bannerColor = '#198754'; }
    else if (pct >= 50) { bannerText = '¡Buen intento!'; bannerColor = '#f59e0b'; }

    return (
      <ScrollView style={styles.resultScreen} contentContainerStyle={styles.resultWrapper}>
        <Text style={styles.resultTitle}>¡Reto completado!</Text>
        <View style={styles.resultCard}>
          <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.resultIcon} resizeMode="contain" />
          <Text style={[styles.trophyText, { color: bannerColor }]}>{bannerText}</Text>
          <Text style={styles.pointsText}>{score} / {totalQuestions} ({pct}%)</Text>
          <TouchableOpacity style={styles.continueBtn} onPress={() => {
            // Reset para volver a la lista de sets
            setSelectedSet(null);
            setQuestions([]);
            setAttemptId(null);
            setShowResult(false);
            setScore(0);
            setQIndex(0);
            setAnswerState({ selectedOptionId: null });
          }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Volver a los retos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // 8) UI de preguntas del set seleccionado
  const isSelected = (optId: string) => answerState.selectedOptionId === optId;
  const isCorrect = (optId: string) => {
    // Marca en verde la opción correcta:
    // - si la respuesta fue correcta: la seleccionada (o la indicada por correctOptionId)
    // - si fue incorrecta: la indicada por correctOptionId
    if (answerState.correct) {
      if (answerState.correctOptionId) return answerState.correctOptionId === optId;
      return isSelected(optId);
    }
    return !!answerState.correctOptionId && answerState.correctOptionId === optId;
  };
  const isWrong = (optId: string) => !!answerState.selectedOptionId && isSelected(optId) && answerState.correct === false;
  // util: estilos para opciones según estado de respuesta

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <View style={styles.band} />
          <Text style={styles.cardTitle}>{selectedSet.title}</Text>
          {/* Barra de progreso */}
          <View style={{ height: 8, backgroundColor: '#e9ecef', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
            <View style={{ width: `${totalQuestions ? Math.round(((qIndex + 1) / totalQuestions) * 100) : 0}%`, backgroundColor: '#198754', height: '100%' }} />
          </View>
          <Text style={styles.question}>{currentQuestion?.prompt || 'Pregunta'}</Text>

          {currentQuestion?.options.map((opt) => {
            const bg = answerState.selectedOptionId
              ? isCorrect(opt.id)
                ? styles.optionCorrect
                : isWrong(opt.id)
                  ? styles.optionWrong
                  : styles.optionDisabled
              : styles.option;

            const letter = String.fromCharCode('A'.charCodeAt(0) + (currentQuestion?.options.findIndex(o => o.id === opt.id) ?? 0));
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionBtn, bg]}
                disabled={!!answerState.selectedOptionId || answering || (!attemptId && Object.keys(localCorrectMap).length === 0)}
                onPress={() => onSelectOption(opt.id)}
              >
                <Text style={styles.optionText}><Text style={{ color: '#198754' }}>{letter}. </Text>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}

          {!attemptId && Object.keys(localCorrectMap).length === 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: '#6b7280' }}>
          
              </Text>
            </View>
          ) : null}

          {answerState.selectedOptionId ? (
            <View style={styles.feedbackBox}>
              {answerState.correct ? (
                <Text style={styles.feedbackCorrect}>{answerState.explanation || '¡Correcto!'}</Text>
              ) : (
                <Text style={styles.feedbackWrong}>{answerState.explanation || 'Respuesta incorrecta'}</Text>
              )}
            </View>
          ) : null}

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setSelectedSet(null);
                setQuestions([]);
                setAttemptId(null);
                setScore(0);
                setQIndex(0);
                setAnswerState({ selectedOptionId: null });
              }}
            >
              <Text style={{ color: '#198754', fontWeight: '700' }}>Salir</Text>
            </TouchableOpacity>
            {attemptId || Object.keys(localCorrectMap).length > 0 ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={nextOrFinish} disabled={!answerState.selectedOptionId || finishing}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{qIndex < (questions.length - 1) ? 'Siguiente' : 'Finalizar reto'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={startAttempt} disabled={starting || !supabaseAccessToken}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{starting ? 'Iniciando...' : 'Comenzar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

