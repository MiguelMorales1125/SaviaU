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
        <View style={[styles.bottomCard, { backgroundColor: '#fffbe6', borderColor: '#ffe58f' }]}>
          <Text style={styles.bottomTitle}>Conecta tu cuenta</Text>
          <Text style={styles.bottomText}>Tus intentos se guardarán y recibirás recomendaciones personalizadas.</Text>
        </View>
      );
    }
    if (statsLoading) {
      return (
        <View style={[styles.bottomCard, { alignItems: 'center', backgroundColor: '#fff' }]}>
          <ActivityIndicator />
        </View>
      );
    }
    if (statsError) {
      return (
        <View style={[styles.bottomCard, { backgroundColor: '#fff5f5', borderColor: '#ffccd5' }]}>
          <Text style={[styles.bottomTitle, { color: '#c1121f' }]}>Sin estadísticas</Text>
          <Text style={styles.bottomText}>{statsError}</Text>
        </View>
      );
    }
    if (!stats) return null;
    return (
      <View style={[styles.bottomCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
        <Text style={styles.bottomTitle}>Tu progreso</Text>
        <Text style={styles.bottomText}>Intentos: {stats.totalAttempts} | Mejor puntaje: {stats.bestScore}% | Promedio: {stats.avgScore.toFixed(2)}%</Text>
        <Text style={[styles.bottomText, { marginTop: 8 }]}>Preguntas respondidas: {stats.totalQuestionsAnswered} • Aciertos: {stats.totalCorrect}</Text>
      </View>
    );
  };

  const renderSetList = () => (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardRow}>
          <View style={[styles.cardLeft, styles.cardList]}>
            <View style={styles.band} />
            <Text style={styles.cardTitle}>Retos disponibles</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>Elige un tema</Text>
            {setsLoading ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : setsError ? (
              <View style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text style={{ color: '#dc2626', fontWeight: '700', textAlign: 'center' }}>{setsError}</Text>
              </View>
            ) : (
              sets.map((set) => (
                <TouchableOpacity key={set.id} style={[styles.optionBtn, styles.optionList]} onPress={() => handleSelectSet(set)}>
                  <Text style={[styles.optionText, { fontSize: 16, marginBottom: 4 }]}>{set.title}</Text>
                  {set.description ? <Text style={{ color: '#6b7280', fontSize: 14 }}>{set.description}</Text> : null}
                </TouchableOpacity>
              ))
            )}
          </View>
          <View style={styles.bottomSection}>{renderStats()}</View>
        </View>
      </ScrollView>
    </View>
  );

  if (!selectedSet) {
    return renderSetList();
  }

  if (result) {
    const pct = Math.round(result.scorePercent);
    let bannerColor = '#c0353a';
    if (pct >= 90) bannerColor = '#198754';
    else if (pct >= 70) bannerColor = '#16a34a';
    else if (pct >= 50) bannerColor = '#f59e0b';
    return (
      <View style={styles.screen}>
        <ScrollView style={styles.resultScreen} contentContainerStyle={styles.resultWrapper}>
        <Text style={styles.resultTitle}>¡Reto completado!</Text>
        <View style={styles.resultCard}>
          <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.resultIcon} resizeMode="contain" />
          <Text style={[styles.trophyText, { color: bannerColor }]}>{selectedSet.title}</Text>
          <View style={styles.pointsBox}>
            <Text style={styles.pointsNumber}>{result.totalCorrect} / {result.totalQuestions}</Text>
            <Text style={styles.pointsPercent}>{pct}%</Text>
          </View>
          {result.recommendedTopics.length ? (
            <View style={[styles.badgeBanner, { marginTop: 16 }]}>
              <Text style={styles.badgeBannerText}>Refuerza: {result.recommendedTopics.join(', ')}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={[styles.continueBtn, { marginTop: 18 }]} onPress={resetToList}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Volver a los retos</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomSection}>{renderStats()}</View>
      </ScrollView>
      </View>
    );
  }

  const topicKey = selectedSet.topic ?? selectedSet.id?.split('-')[0] ?? 'clima';
  const sideImage = sideImageByTopic[topicKey] ?? require('../../assets/images/test1.png');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.cardRow, isWide && { flexDirection: 'row', alignItems: 'stretch' }]}>
        <View style={[styles.cardLeft, isWide && { width: '60%', borderRightWidth: 0 }]}>
          <View style={styles.band} />
          <Text style={styles.cardTitle}>{selectedSet.title}</Text>
          {questionsLoading ? (
            <ActivityIndicator />
          ) : questionsError ? (
            <Text style={{ color: '#842029', fontWeight: '700' }}>{questionsError}</Text>
          ) : !attemptId ? (
            <View>
              <Text style={styles.question}>¿Listo para comenzar?</Text>
              <TouchableOpacity style={[styles.primaryBtn, { alignSelf: 'flex-start' }]} onPress={handleStart} disabled={starting || !supabaseAccessToken}>
                {starting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Comenzar reto</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 12 }} onPress={resetToList}>
                <Text style={{ color: '#198754', fontWeight: '700' }}>Volver al listado</Text>
              </TouchableOpacity>
            </View>
          ) : currentQuestion ? (
            <>
              <View style={{ height: 8, backgroundColor: '#e9ecef', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                <View style={{ width: `${progressPercent}%`, backgroundColor: '#198754', height: '100%' }} />
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
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={resetToList}>
                  <Text style={{ color: '#198754', fontWeight: '700', textAlign: 'center' }}>Salir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1, opacity: answerState ? 1 : 0.6 }]}
                  disabled={!answerState || finishing}
                  onPress={currentIndex === questions.length - 1 ? handleFinish : goToNext}
                >
                  {finishing ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
                      {currentIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
        {isWide ? (
          <View style={[styles.cardRight, { width: '40%', padding: 18 }]}>
            <Image source={sideImage} style={[styles.sideImage, { borderRadius: 12 }]} resizeMode="cover" />
            <View style={[styles.badgeBanner, { marginTop: 16 }]}>
              <Text style={styles.badgeBannerText}>{user?.fullName ? `Vamos, ${user.fullName}!` : 'Mantén tu racha'}</Text>
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.bottomSection}>{renderStats()}</View>
    </ScrollView>
    </View>
  );
}
