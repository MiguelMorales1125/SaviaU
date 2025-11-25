
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Image, useWindowDimensions, StyleSheet, Animated, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchDiagnosticStatus, fetchQuestions, submitDiagnostic, fetchLastResult, Question } from '../services/diagnostic';
import { useRouter } from 'expo-router';
import { indexStyles as headerStyles } from '../styles/index.styles';
import { useRef } from 'react';

export default function DiagnosticScreen() {
  const { user, supabaseAccessToken, setDiagnosticCompleted } = useAuth();
  const router = useRouter();

  // header animations (reuse the same look as Index header)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Manual token entry removed: only use authenticated supabaseAccessToken

  useEffect(() => {
    loadQuestions();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // Ensure hooks are always called in the same order — window dimensions must be
  // retrieved before any early returns to avoid hook order mismatch on web.
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  // Render header sizing and node early so it can be used by the result branch
  const isSmallScreen = width < 640;
  const MOBILE_LOGO = { width: 140, height: 60 };
  const DESKTOP_LOGO = { width: 220, height: 180 };
  let logoWidth = isSmallScreen ? MOBILE_LOGO.width : DESKTOP_LOGO.width;
  let logoHeight = isSmallScreen ? MOBILE_LOGO.height : DESKTOP_LOGO.height;
  const headerNode = (
    <Animated.View style={[
      headerStyles.header,
      { paddingTop: isSmallScreen ? 12 : 16, paddingBottom: isSmallScreen ? 8 : 10, height: isSmallScreen ? 64 : 80, opacity: fadeAnim, transform: [{ translateY: slideAnim }], borderRadius: 0 },
    ]}>
      <View style={headerStyles.navContainer}>
        <View style={[headerStyles.logoSection, { marginTop: 0 }]}> 
          <Image source={require('../assets/images/SaviaU-Logo.png')} style={[headerStyles.navLogo, { width: logoWidth, height: logoHeight }]} resizeMode="contain" />
        </View>
        {/* preserve spacing but no login button */}
        <View style={headerStyles.navButtons} />
      </View>
    </Animated.View>
  );

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch questions (public endpoint)
      try {
        const qs = await fetchQuestions();
        setQuestions(qs || []);
        setError(null);
      } catch (e: any) {
        console.error('fetchQuestions failed', e);
        setQuestions([]);
        setError(e?.message || String(e));
      }

      // If user is authenticated, check diagnostic status
      const tokenToUse = supabaseAccessToken;
      if (tokenToUse && tokenToUse.trim() !== '') {
        try {
          console.log('[Diagnostic] Checking status with token:', tokenToUse.substring(0, 20) + '...');
          const st = await fetchDiagnosticStatus(tokenToUse);
          console.log('[Diagnostic] Status response:', st);
          if (st.completed) {
            // mark the diagnostic as completed in the global auth state so
            // the app doesn't keep redirecting users back to the diagnostic
            // screen or show it again after refresh.
            try {
              if (setDiagnosticCompleted) setDiagnosticCompleted(true);
            } catch (e) {}
            const last = await fetchLastResult(tokenToUse).catch(() => null);
            setResult(last);
            return;
          }
        } catch (e: any) {
          console.warn('[Diagnostic] Status check failed, allowing user to continue:', e);
          // don't block questions display if status check fails - user might be new
        }
      } else {
        console.warn('[Diagnostic] No access token available, skipping status check');
      }
    } catch (err: any) {
      console.error('[Diagnostic] Error loading questions:', err);
      // Use window.alert on web where Alert.alert may not be available
      if (typeof window !== 'undefined') window.alert('Error: ' + String(err));
      else Alert.alert('Error', String(err));
    } finally {
      setLoading(false);
    }
  }, [supabaseAccessToken]);

  const pick = (qId: string, optionId: string) => setAnswers(a => ({ ...a, [qId]: optionId }));

  const goNext = () => {
    if (!questions[currentIndex]) return;
    const q = questions[currentIndex];
    if (!answers[q.id]) {
      if (typeof window !== 'undefined') window.alert('Validación: Responde la pregunta antes de continuar.');
      else Alert.alert('Validación', 'Responde la pregunta antes de continuar.');
      return;
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
    else handleSubmit();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const handleSubmit = async () => {
    if (questions.some(q => !answers[q.id])) {
      // keep the alert for accessibility but also show inline message in UI
      if (typeof window !== 'undefined') window.alert('Valida: Responde todas las preguntas antes de enviar.');
      else Alert.alert('Valida', 'Responde todas las preguntas antes de enviar.');
      return;
    }
    setSubmitting(true);
    try {
      const tokenToUse = supabaseAccessToken;
      if (!tokenToUse) {
        const msg = 'Inicia sesión para enviar el diagnóstico.';
        if (typeof window !== 'undefined') window.alert(msg);
        else Alert.alert('Token requerido', msg);
        setSubmitting(false);
        return;
      }

      const payload = {
        accessToken: tokenToUse,
        answers: Object.keys(answers).map(qId => ({ questionId: qId, optionId: answers[qId] })),
      };
      const res = await submitDiagnostic(payload);
      setResult(res);
      if (setDiagnosticCompleted) setDiagnosticCompleted(true);
    } catch (err: any) {
      console.error('submitDiagnostic failed', err);
      if (typeof window !== 'undefined') window.alert('Error: ' + (err?.message || 'No se pudo enviar el diagnóstico'));
      else Alert.alert('Error', err?.message || 'No se pudo enviar el diagnóstico');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;

  const allAnswered = questions.length > 0 && questions.every(q => Boolean(answers[q.id]));

  if (result) {
    // Result view: centered trophy / badge layout similar to provided screenshot
    const scoreLabel = typeof result.scorePercent === 'number' ? `${result.scorePercent.toFixed(1)}%` : `${result.scorePercent}%`;
    const correct = result.totalCorrect ?? 0;
    const total = result.totalQuestions ?? (questions.length || 0);
    const recommended = (result.recommendedTopics && result.recommendedTopics.length) ? result.recommendedTopics.join(', ') : '-';
    // Choose badge text based on score — keep simple heuristics
    let badgeText = '¡HECHO!';
    if (typeof result.scorePercent === 'number') {
      if (result.scorePercent >= 90) badgeText = '¡PERFECTO!';
      else if (result.scorePercent >= 70) badgeText = '¡MUY BIEN!';
      else if (result.scorePercent >= 40) badgeText = '¡BIEN!';
      else badgeText = 'Sigue practicando';
    }

    return (
      <>
        {headerNode}
        <ScrollView style={{ flex: 1, backgroundColor: '#f4f7f6' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <View style={{ width: '100%', maxWidth: 820, alignItems: 'center', paddingHorizontal: 24 }}>
            <Text style={{ fontWeight: '800', fontSize: 26, marginBottom: 6, textAlign: 'center' }}>{'¡Cuestionario Completado!'}</Text>
            <Text style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>{`Respondiste correctamente ${correct} de ${total} preguntas.`}</Text>

            {/* Big trophy circle like the designs */}
            <View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: '#2ea449', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 84 }}>🏆</Text>
            </View>

            {/* Badge (green pill) */}
            <View style={{ backgroundColor: '#198754', paddingVertical: 10, paddingHorizontal: 26, borderRadius: 28, marginBottom: 14 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{badgeText}</Text>
            </View>

            {/* Score big */}
            <Text style={{ fontWeight: '800', fontSize: 22, marginBottom: 6 }}>{result.points ? `${result.points} puntos` : `${scoreLabel}`}</Text>
            <Text style={{ color: '#666', marginBottom: 10 }}>{result.subtitle ? result.subtitle : 'Primer Desafío'}</Text>

            <Text style={{ color: '#444', marginBottom: 22 }}>Recomendaciones: {recommended}</Text>

            <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={{ backgroundColor: '#198754', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 28 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      {headerNode}
      <ScrollView style={{ flex: 1, backgroundColor: '#eef8f0' }} contentContainerStyle={{ flexGrow: 1, justifyContent: questions.length ? 'flex-start' : 'center', padding: 24 }}>
      {/* Manual token input removed: users must sign in to submit the diagnostic */}

      {questions.length === 0 ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>No hay preguntas disponibles en este momento.</Text>
          {error ? (
            <>
              <Text style={{ fontSize: 13, color: '#a00', marginBottom: 8, textAlign: 'center' }}>Error: {String(error).split('\n')[0]}</Text>
              <TouchableOpacity onPress={() => setShowDetails(s => !s)} style={{ marginBottom: 8 }}>
                <Text style={{ color: '#0d6efd' }}>{showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}</Text>
              </TouchableOpacity>
              {showDetails && (
                <View style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, width: '100%', marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, color: '#333' }}>{error}</Text>
                </View>
              )}
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 12, textAlign: 'center' }}>Si ves un 500: revisa que el backend esté corriendo y que la tabla 'diagnostic_questions' exista. En el servidor backend ejecuta: <Text style={{ fontWeight: '700' }}>./mvnw spring-boot:run</Text> y revisa la consola para errores.</Text>
            </>
          ) : (
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 12, textAlign: 'center' }}>Si esto persiste, verifica que el backend tenga preguntas (archivo backend/docs/diagnostic-sample-data.sql).</Text>
          )}
          <TouchableOpacity onPress={loadQuestions} style={{ backgroundColor: '#0d6efd', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }}>
            <Text style={{ color: '#fff' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.outerContainer, isWide ? styles.outerRow : undefined]}>
          <View style={[styles.leftCard, isWide ? { flex: 1 } : { width: '100%' }]}> 
            <Text style={styles.pageTitle}>Test diagnóstico.</Text>
            <Text style={styles.subtitle}>Responde las siguientes preguntas para saber en qué nivel te encuentras en las temáticas.</Text>

            <View style={{ marginTop: 18 }}>
              {/* Single-question view */}
              {(() => {
                const q = questions[currentIndex];
                const answered = q ? Boolean(answers[q.id]) : false;
                return (
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.questionTitle}>{currentIndex + 1}. {q.prompt}</Text>
                      <Text style={{ color: '#666' }}>{currentIndex + 1}/{questions.length}</Text>
                    </View>
                    <Text style={styles.questionMeta}>Tema: {q.topic || '-'} | Dificultad: {q.difficulty || '-'}</Text>

                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === opt.id;
                      const letter = String.fromCharCode(65 + oi); // A, B, C...
                      return (
                        <TouchableOpacity key={opt.id} onPress={() => pick(q.id, opt.id)} style={[styles.optionRow, selected ? styles.optionSelected : undefined]}>
                          <View style={[styles.radio, selected ? styles.radioSelected : undefined]} />
                          <Text style={styles.optionText}>{letter}) {String(opt.text).toUpperCase()}</Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* navigation */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                      <TouchableOpacity onPress={goPrev} disabled={currentIndex === 0} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: currentIndex === 0 ? '#f0f0f0' : '#fff', borderWidth: 1, borderColor: '#e9ecef', marginRight: 8 }}>
                        <Text style={{ color: currentIndex === 0 ? '#999' : '#111' }}>Anterior</Text>
                      </TouchableOpacity>

                      <View style={{ flex: 1 }} />

                      <TouchableOpacity onPress={goNext} disabled={!answered} style={[styles.continueBtn, !answered ? { opacity: 0.6 } : undefined]}>
                        <Text style={styles.continueText}>{currentIndex === questions.length - 1 ? (submitting ? 'Enviando...' : 'Finalizar') : 'Continuar'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={[styles.rightImageWrap, isWide ? { flex: 0.5 } : { width: '100%', marginTop: 18 } ]}> 
            <Image source={require('../assets/images/mundo.png')} style={styles.illustration} resizeMode="contain" />
          </View>
        </View>
      )}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'stretch',
  },
  outerRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start'
  },
  leftCard: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 8,
    // subtle shadow for web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0b6b3b'
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22
  },
  questionBlock: {
    marginBottom: 18,
  },
  questionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  questionMeta: {
    color: '#666',
    marginBottom: 8,
    fontSize: 13
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9f9',
    marginTop: 6
  },
  optionSelected: {
    backgroundColor: '#eef7ef'
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#777',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#198754',
    backgroundColor: '#198754'
  },
  optionText: {
    fontSize: 15,
    color: '#111'
  },
  rightImageWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  illustration: {
    width: '100%',
    maxHeight: 420,
    borderRadius: 8,
  },
  continueBtn: {
    borderWidth: 2,
    borderColor: '#198754',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: 'transparent'
  },
  continueText: {
    color: '#198754',
    fontWeight: '700'
  }
});
