import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { retosStyles as styles } from '../../styles/retos.styles';
import { useAuth } from '../../context/AuthContext';
import {
  triviaApi,
  type TriviaAnswerResponse,
  type TriviaQuestion,
  type TriviaResultDto,
  type TriviaSet,
  type TriviaStatsDto,
} from '../../services/trivia';

const sideImageByTopic: Record<string, ImageSourcePropType> = {
  clima: require('../../assets/images/test1.png'),
  renovables: require('../../assets/images/test2.png'),
  biodiversidad: require('../../assets/images/test3.png'),
  residuos: require('../../assets/images/test4.png'),
  agua: require('../../assets/images/test5.png'),
  economia: require('../../assets/images/test6.png'),
};

type AnswerLedger = TriviaAnswerResponse | null;

export default function Retos() {
  const { supabaseAccessToken, user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const [sets, setSets] = useState<TriviaSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [setsError, setSetsError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<TriviaSet | null>(null);

  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerLedger>(null);
  const [answering, setAnswering] = useState(false);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [result, setResult] = useState<TriviaResultDto | null>(null);
  const [stats, setStats] = useState<TriviaStatsDto | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    const answered = currentIndex + (answerState ? 1 : 0);
    return Math.round((answered / questions.length) * 100);
  }, [questions.length, currentIndex, answerState]);

  useEffect(() => {
    const loadSets = async () => {
      setSetsLoading(true);
      setSetsError(null);
      try {
        const data = await triviaApi.getSets();
        setSets(data);
      } catch (err: any) {
        setSetsError(err?.message ?? 'No pudimos cargar los retos.');
      } finally {
        setSetsLoading(false);
      }
    };
    loadSets();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!supabaseAccessToken) {
        setStats(null);
        return;
      }
      setStatsLoading(true);
      setStatsError(null);
      try {
        const data = await triviaApi.getStats(supabaseAccessToken);
        setStats(data);
      } catch (err: any) {
        setStatsError(err?.message ?? 'No pudimos traer tus estadísticas.');
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [supabaseAccessToken]);

  const handleSelectSet = async (set: TriviaSet) => {
    setSelectedSet(set);
    setCurrentIndex(0);
    setQuestions([]);
    setAnswerState(null);
    setAttemptId(null);
    setResult(null);
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const data = await triviaApi.getQuestions(set.id);
      setQuestions(data);
    } catch (err: any) {
      setQuestionsError(err?.message ?? 'No pudimos cargar las preguntas.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const ensureToken = () => {
    if (!supabaseAccessToken) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para registrar tu progreso.');
      return false;
    }
    return true;
  };

  const handleStart = async () => {
    if (!selectedSet || !ensureToken()) return;
    setStarting(true);
    setAnswerState(null);
    setCurrentIndex(0);
    try {
      const resp = await triviaApi.start({ accessToken: supabaseAccessToken!, setId: selectedSet.id });
      setAttemptId(resp.attemptId);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No pudimos iniciar el reto.');
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = async (optionId: string) => {
    if (!attemptId || !currentQuestion || answering) return;
    setAnswering(true);
    try {
      const resp = await triviaApi.answer({
        accessToken: supabaseAccessToken!,
        attemptId,
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      });
      setAnswerState(resp);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No pudimos registrar la respuesta.');
    } finally {
      setAnswering(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setAnswerState(null);
    }
  };

  const handleFinish = async () => {
    if (!attemptId || finishing) return;
    setFinishing(true);
    try {
      const data = await triviaApi.finish({ accessToken: supabaseAccessToken!, attemptId });
      setResult(data);
      try {
        const updatedStats = await triviaApi.getStats(supabaseAccessToken!);
        setStats(updatedStats);
      } catch {}
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No pudimos cerrar el reto.');
    } finally {
      setFinishing(false);
    }
  };

  const resetToList = () => {
    setSelectedSet(null);
    setQuestions([]);
    setAttemptId(null);
    setAnswerState(null);
    setCurrentIndex(0);
    setResult(null);
  };

  const renderStats = () => {
    if (!supabaseAccessToken) {
      return (
        <View style={styles.statsCard}>
          <View style={[styles.band, { marginBottom: 16 }]} />
          <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Conecta tu cuenta</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', lineHeight: 20 }}>Tus intentos se guardarán y recibirás recomendaciones personalizadas.</Text>
        </View>
      );
    }
    if (statsLoading) {
      return (
        <View style={[styles.statsCard, { alignItems: 'center', justifyContent: 'center', minHeight: 200 }]}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      );
    }
    if (statsError) {
      return (
        <View style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: '#dc2626', marginBottom: 8 }]}>Sin estadísticas</Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>{statsError}</Text>
        </View>
      );
    }
    if (!stats) return null;
    return (
      <View style={styles.statsCard}>
        <View style={[styles.band, { marginBottom: 16 }]} />
        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Tu progreso</Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>Intentos realizados</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#1f2937' }}>{stats.totalAttempts}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, padding: 12, backgroundColor: '#ecfdf5', borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0' }}>
            <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4, fontWeight: '600' }}>Mejor</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#047857' }}>{stats.bestScore}%</Text>
          </View>
          <View style={{ flex: 1, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#d1fae5' }}>
            <Text style={{ fontSize: 12, color: '#059669', marginBottom: 4, fontWeight: '600' }}>Promedio</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#10b981' }}>{stats.avgScore.toFixed(2)}%</Text>
          </View>
        </View>

        <View style={{ padding: 14, backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Preguntas respondidas</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937' }}>{stats.totalQuestionsAnswered}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Respuestas correctas</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>{stats.totalCorrect}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSetList = () => (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.cardRow, isWide && { flexDirection: 'row', gap: 20 }]}>
          <View style={[styles.cardLeft, styles.cardList, isWide && { flex: 1 }]}>
          <View style={styles.band} />
          <Text style={styles.cardTitle}>Retos disponibles</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 20 }}>
            Elige un tema para comenzar
          </Text>
          {setsLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : setsError ? (
            <View style={{ padding: 20, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ color: '#dc2626', fontWeight: '700', textAlign: 'center' }}>{setsError}</Text>
            </View>
          ) : (
            sets.map((set) => (
              <TouchableOpacity key={set.id} style={[styles.optionBtn, styles.optionList]} onPress={() => handleSelectSet(set)}>
                <Text style={[styles.optionText, { fontSize: 17, marginBottom: 4 }]}>{set.title}</Text>
                {set.description ? <Text style={{ color: '#6b7280', fontSize: 14 }}>{set.description}</Text> : null}
              </TouchableOpacity>
            ))
          )}
        </View>
        {isWide && (
          <View style={{ width: 340 }}>
            {renderStats()}
          </View>
        )}
      </View>
      {!isWide && (
        <View style={{ marginTop: 20, width: '100%', maxWidth: 1200 }}>
          {renderStats()}
        </View>
      )}
    </ScrollView>
    </View>
  );

  if (!selectedSet) {
    return renderSetList();
  }

  if (result) {
    const pct = Math.round(result.scorePercent);
    let bannerColor = '#dc2626';
    let bgColor = '#fef2f2';
    let message = '¡Sigue practicando!';
    if (pct >= 90) {
      bannerColor = '#059669';
      bgColor = '#d1fae5';
      message = '¡Excelente trabajo!';
    } else if (pct >= 70) {
      bannerColor = '#10b981';
      bgColor = '#d1fae5';
      message = '¡Muy bien hecho!';
    } else if (pct >= 50) {
      bannerColor = '#f59e0b';
      bgColor = '#fef3c7';
      message = '¡Buen intento!';
    }
    return (
      <View style={styles.resultScreen}>
        <ScrollView contentContainerStyle={styles.resultWrapper}>
          <View style={[styles.cardRow, isWide && { flexDirection: 'row', gap: 20, maxWidth: 1200 }]}>
          <View style={[styles.resultCard, isWide && { flex: 1 }]}>
            <View style={[styles.band, { alignSelf: 'center', marginBottom: 20 }]} />
            <Text style={styles.resultTitle}>¡Reto completado!</Text>
            <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.resultIcon} resizeMode="contain" />
            <Text style={[styles.trophyText, { fontSize: 18, color: '#6b7280', fontWeight: '600' }]}>{selectedSet.title}</Text>
            <View style={[{ paddingVertical: 20, paddingHorizontal: 24, borderRadius: 16, marginTop: 16, width: '100%' }, { backgroundColor: bgColor }]}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: bannerColor, textAlign: 'center', marginBottom: 8 }}>{message}</Text>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsNumber}>{result.totalCorrect} / {result.totalQuestions}</Text>
                <Text style={[styles.pointsPercent, { color: bannerColor }]}>{pct}% correctas</Text>
              </View>
            </View>
            {result.recommendedTopics.length ? (
              <View style={{ marginTop: 20, padding: 16, backgroundColor: '#fef3c7', borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d', width: '100%' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 }}>💡 Recomendación</Text>
                <Text style={{ fontSize: 14, color: '#78350f' }}>Refuerza estos temas: {result.recommendedTopics.join(', ')}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.continueBtn} onPress={resetToList}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Volver a los retos</Text>
            </TouchableOpacity>
          </View>
          {isWide && (
            <View style={{ width: 340 }}>
              {renderStats()}
            </View>
          )}
        </View>
        {!isWide && (
          <View style={{ marginTop: 20, width: '100%', maxWidth: 500 }}>
            {renderStats()}
          </View>
        )}
      </ScrollView>
      </View>
    );
  }

  const topicKey = selectedSet.topic ?? selectedSet.id?.split('-')[0] ?? 'clima';
  const sideImage = sideImageByTopic[topicKey] ?? require('../../assets/images/test1.png');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.cardRow, isWide && { flexDirection: 'row', gap: 20 }]}>
        <View style={[styles.cardLeft, isWide && { flex: 1 }]}>
          <View style={styles.band} />
          <Text style={styles.cardTitle}>{selectedSet.title}</Text>
          {questionsLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 15 }}>Cargando preguntas...</Text>
            </View>
          ) : questionsError ? (
            <View style={{ padding: 24, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Error</Text>
              <Text style={{ color: '#991b1b', fontSize: 14 }}>{questionsError}</Text>
            </View>
          ) : !attemptId ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={[styles.question, { textAlign: 'center', marginBottom: 8 }]}>¿Listo para comenzar?</Text>
              <Text style={{ fontSize: 15, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
                Responde todas las preguntas para obtener tu puntuación
              </Text>
              <TouchableOpacity 
                style={[styles.primaryBtn, { paddingHorizontal: 40, paddingVertical: 16 }]} 
                onPress={handleStart} 
                disabled={starting || !supabaseAccessToken}
              >
                {starting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Comenzar reto</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 16 }} onPress={resetToList}>
                <Text style={{ color: '#10b981', fontWeight: '600' }}>← Volver al listado</Text>
              </TouchableOpacity>
            </View>
          ) : currentQuestion ? (
            <>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280' }}>
                    Pregunta {currentIndex + 1} de {questions.length}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>
                    {progressPercent}%
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                  <View style={{ width: `${progressPercent}%`, backgroundColor: '#10b981', height: '100%', borderRadius: 999 }} />
                </View>
              </View>
              <Text style={styles.question}>{currentQuestion.prompt}</Text>
              {currentQuestion.options.map((opt) => {
                const selected = answerState?.selectedOptionId === opt.id;
                const isCorrectOption = answerState?.correctOptionId === opt.id;
                let palette = styles.option;
                if (answerState) {
                  if (selected) palette = answerState.correct ? styles.optionCorrect : styles.optionWrong;
                  else if (isCorrectOption) palette = styles.optionCorrect;
                  else palette = styles.optionDisabled;
                }
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionBtn, palette]}
                    disabled={!!answerState || answering}
                    onPress={() => handleAnswer(opt.id)}
                  >
                    <Text style={styles.optionText}>{opt.text}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.feedbackBox, answerState ? (answerState.correct ? styles.feedbackSuccess : styles.feedbackDanger) : null]}>
                {answerState ? (
                  <>
                    <Text style={answerState.correct ? styles.feedbackCorrect : styles.feedbackWrong}>
                      {answerState.correct ? '¡Correcto!' : 'Respuesta incorrecta'}
                    </Text>
                    {answerState.explanation ? (
                      <Text style={styles.feedbackBody}>{answerState.explanation}</Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={{ color: '#6c757d', fontWeight: '700' }}>Selecciona una opción para desbloquear la retroalimentación.</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={resetToList}>
                  <Text style={{ color: '#10b981', fontWeight: '700', textAlign: 'center', fontSize: 15 }}>Salir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, opacity: answerState ? 1 : 0.5 }]}
                  disabled={!answerState || finishing}
                  onPress={currentIndex === questions.length - 1 ? handleFinish : goToNext}
                >
                  {finishing ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 15 }}>
                      {currentIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente →'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
        {isWide && (
          <View style={{ width: 340 }}>
            {renderStats()}
            <View style={{ marginTop: 20, padding: 16, backgroundColor: '#065f46', borderRadius: 12, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {user?.fullName ? `¡Vamos, ${user.fullName}!` : '¡Mantén tu racha!'}
              </Text>
            </View>
          </View>
        )}
      </View>
      {!isWide && (
        <View style={{ marginTop: 20, width: '100%', maxWidth: 1200 }}>
          {renderStats()}
        </View>
      )}
    </ScrollView>
    </View>
  );
}
