import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  StyleProp,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Svg, { Line, Polyline, Text as SvgText, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import {
  adminTriviaApi,
  AdminLeaderboardRow,
  AdminTriviaOption,
  AdminTriviaQuestion,
  AdminTriviaSet,
  AdminUserProgress,
  AdminTriviaHistory,
} from '../../services/admin';
import { TematicaArea, TematicaAreaSummary, TematicaResource } from '../../services/tematicas';

type TabKey = 'overview' | 'questions' | 'tematicas' | 'analytics';

type ToastState = { type: 'success' | 'error'; message: string } | null;

type QuestionFormState = {
  id?: string;
  setId: string;
  prompt: string;
  topic?: string;
  difficulty?: string;
  active: boolean;
  options: AdminTriviaOption[];
};

type AreaFormState = {
  id?: string;
  name: string;
  summary: string;
  accentColor: string;
  heroImage: string;
  tagline: string;
  learningFocusText: string;
};

type ResourceFormState = {
  id?: string;
  areaId: string;
  title: string;
  shortDescription: string;
  detailDescription: string;
  imageUrl: string;
  format: string;
  estimatedTime: string;
  funFact: string;
  deepDive: string;
  sourcesText: string;
};

type TematicaLoadOptions = {
  silent?: boolean;
  skipState?: boolean;
  suppressToast?: boolean;
};

const defaultOption = (overrides?: Partial<AdminTriviaOption>): AdminTriviaOption => ({
  text: '',
  correct: false,
  explanation: '',
  ...overrides,
});

const makeEmptyQuestion = (setId: string): QuestionFormState => ({
  setId,
  prompt: '',
  topic: '',
  difficulty: '',
  active: true,
  options: [defaultOption({ correct: true }), defaultOption(), defaultOption()],
});

const makeEmptyAreaForm = (): AreaFormState => ({
  name: '',
  summary: '',
  accentColor: '',
  heroImage: '',
  tagline: '',
  learningFocusText: '',
});

const makeEmptyResourceForm = (areaId: string): ResourceFormState => ({
  areaId,
  title: '',
  shortDescription: '',
  detailDescription: '',
  imageUrl: '',
  format: '',
  estimatedTime: '',
  funFact: '',
  deepDive: '',
  highlighted: false,
  sourcesText: '',
});

export default function AdminPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, adminToken, logout } = useAuth();
  const navigatingRef = useRef(false);
  
  // Estado de verificación inicial
  const [isVerifying, setIsVerifying] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sets, setSets] = useState<AdminTriviaSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AdminTriviaQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardRow[]>([]);
  const [cohortProgress, setCohortProgress] = useState<AdminUserProgress[]>([]);
  const [selectedUserProgress, setSelectedUserProgress] = useState<AdminUserProgress | null>(null);
  const [userHistory, setUserHistory] = useState<AdminTriviaHistory[]>([]);

  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [setForm, setSetForm] = useState<{ id?: string; title: string; description?: string; topic?: string; active: boolean }>({
    title: '',
    description: '',
    topic: '',
    active: true,
  });
  const [questionForm, setQuestionForm] = useState<QuestionFormState | null>(null);
  const [tematicaAreas, setTematicaAreas] = useState<TematicaAreaSummary[]>([]);
  const [selectedTematicaId, setSelectedTematicaId] = useState<string | null>(null);
  const [tematicaDetail, setTematicaDetail] = useState<TematicaArea | null>(null);
  const [loadingTematicas, setLoadingTematicas] = useState(false);
  const [loadingTematicaDetail, setLoadingTematicaDetail] = useState(false);
  const [tematicaAreaModalVisible, setTematicaAreaModalVisible] = useState(false);
  const [tematicaResourceModalVisible, setTematicaResourceModalVisible] = useState(false);
  const [areaForm, setAreaForm] = useState<AreaFormState>(makeEmptyAreaForm());
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(makeEmptyResourceForm(''));

  const isAdmin = user?.role === 'admin' || Boolean(adminToken);

  // Debug: log adminToken on mount and when it changes
  useEffect(() => {
    console.log('[Admin Panel] adminToken:', adminToken ? `${adminToken.substring(0, 20)}...` : 'UNDEFINED');
    console.log('[Admin Panel] user role:', user?.role);
    console.log('[Admin Panel] isAdmin:', isAdmin);
    
    // Dar tiempo para que el contexto se actualice
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [adminToken, user?.role, isAdmin]);

  useEffect(() => {
    try { (navigation as any)?.setOptions?.({ headerShown: false }); } catch {}
  }, [navigation]);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const onBeforeRemove = (e: any) => {
      const actionType = e?.data?.action?.type;
      if (actionType !== 'GO_BACK' && actionType !== 'POP') {
        return;
      }
      if (navigatingRef.current) return;
      try { e?.preventDefault?.(); } catch {}
      navigatingRef.current = true;
      try { logout(); } catch {}
      try { unsub && unsub(); } catch {}
      setTimeout(() => router.replace('/(auth)/login'), 0);
    };

    unsub = navigation.addListener('beforeRemove', onBeforeRemove);

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigatingRef.current) return true;
      navigatingRef.current = true;
      try { logout(); } catch {}
      setTimeout(() => router.replace('/(auth)/login'), 0);
      return true;
    });

    let popHandler: ((this: Window, ev: PopStateEvent) => any) | undefined;
    if (Platform.OS === 'web') {
      popHandler = () => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        try { logout(); } catch {}
        setTimeout(() => router.replace('/(auth)/login'), 0);
      };
      try { window.addEventListener('popstate', popHandler); } catch {}
    }

    return () => {
      try { unsub && unsub(); } catch {}
      try { backSub.remove(); } catch {}
      if (Platform.OS === 'web' && popHandler) {
        try { window.removeEventListener('popstate', popHandler); } catch {}
      }
    };
  }, [navigation, router, logout]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const loadSets = useCallback(async () => {
    if (!adminToken) {
      console.error('[Admin Panel] loadSets: adminToken is undefined!');
      return;
    }
    console.log('[Admin Panel] loadSets: Fetching sets with token:', adminToken.substring(0, 20) + '...');
    setLoadingSets(true);
    try {
      const data = await adminTriviaApi.fetchSets(adminToken);
      console.log('[Admin Panel] loadSets: Success, loaded', data.length, 'sets');
      setSets(data);
      if (!selectedSetId && data.length) {
        setSelectedSetId(data[0].id);
      }
    } catch (err: any) {
      console.error('[Admin Panel] loadSets: Error:', err);
      showToast('error', err?.message || 'No se pudieron cargar las trivias');
    } finally {
      setLoadingSets(false);
    }
  }, [adminToken, selectedSetId]);

  const loadQuestions = useCallback(async (targetSetId?: string) => {
    if (!adminToken) {
      console.error('[Admin Panel] loadQuestions: adminToken is undefined!');
      return;
    }
    const effectiveSetId = targetSetId || selectedSetId;
    if (!effectiveSetId) {
      setQuestions([]);
      return;
    }
    console.log('[Admin Panel] loadQuestions: Fetching questions for set:', effectiveSetId);
    setLoadingQuestions(true);
    try {
      const data = await adminTriviaApi.fetchQuestions(adminToken, effectiveSetId);
      console.log('[Admin Panel] loadQuestions: Success, loaded', data.length, 'questions');
      setQuestions(data);
    } catch (err: any) {
      console.error('[Admin Panel] loadQuestions: Error:', err);
      showToast('error', err?.message || 'No se pudieron cargar las preguntas');
    } finally {
      setLoadingQuestions(false);
    }
  }, [adminToken, selectedSetId]);

  const loadAnalytics = useCallback(async () => {
    if (!adminToken) return;
    setLoadingAnalytics(true);
    try {
      const [lb, cohort] = await Promise.all([
        adminTriviaApi.fetchLeaderboard(adminToken, 15),
        adminTriviaApi.fetchCohortProgress(adminToken, 25),
      ]);
      setLeaderboard(lb);
      setCohortProgress(cohort);
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudieron cargar las métricas');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [adminToken]);

  const loadUserProgress = useCallback(async (userId: string) => {
    if (!adminToken) return;
    try {
      setLoadingHistory(true);
      const [detail, history] = await Promise.all([
        adminTriviaApi.fetchUserProgress(adminToken, userId),
        adminTriviaApi.fetchUserHistory(adminToken, userId, 30),
      ]);
      setSelectedUserProgress(detail);
      setUserHistory(history);
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo cargar el detalle del usuario');
    } finally {
      setLoadingHistory(false);
    }
  }, [adminToken]);

  const loadTematicaArea = useCallback(async (areaId: string, options?: TematicaLoadOptions) => {
    if (!adminToken || !areaId) return null;
    const silent = options?.silent ?? false;
    if (!silent) setLoadingTematicaDetail(true);
    try {
      const detail = await adminTriviaApi.fetchTematicaArea(adminToken, areaId);
      if (!options?.skipState) {
        setTematicaDetail(detail);
      }
      return detail;
    } catch (err: any) {
      if (!options?.suppressToast) {
        showToast('error', err?.message || 'No se pudo cargar la temática');
      }
      return null;
    } finally {
      if (!silent) setLoadingTematicaDetail(false);
    }
  }, [adminToken]);

  const loadTematicaAreas = useCallback(async () => {
    if (!adminToken) return;
    setLoadingTematicas(true);
    try {
      const data = await adminTriviaApi.fetchTematicaAreas(adminToken);
      setTematicaAreas(data);
      if (!selectedTematicaId && data.length) {
        setSelectedTematicaId(data[0].id);
      } else if (selectedTematicaId && data.every((area) => area.id !== selectedTematicaId)) {
        setSelectedTematicaId(data.length ? data[0].id : null);
        setTematicaDetail(null);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'No pudimos cargar las temáticas');
    } finally {
      setLoadingTematicas(false);
    }
  }, [adminToken, selectedTematicaId]);

  useEffect(() => {
    if (adminToken) {
      loadSets();
    }
  }, [adminToken, loadSets]);

  useEffect(() => {
    if (adminToken && selectedSetId) {
      loadQuestions(selectedSetId);
    }
  }, [adminToken, selectedSetId, loadQuestions]);

  useEffect(() => {
    if (activeTab === 'analytics' && leaderboard.length === 0 && adminToken) {
      loadAnalytics();
    }
  }, [activeTab, leaderboard.length, loadAnalytics, adminToken]);

  useEffect(() => {
    if (!adminToken) {
      setTematicaAreas([]);
      setSelectedTematicaId(null);
      setTematicaDetail(null);
    }
  }, [adminToken]);

  useEffect(() => {
    if (activeTab === 'tematicas' && adminToken) {
      loadTematicaAreas();
    }
  }, [activeTab, adminToken, loadTematicaAreas]);

  useEffect(() => {
    if (!adminToken || activeTab !== 'tematicas' || !selectedTematicaId) return;
    loadTematicaArea(selectedTematicaId);
  }, [adminToken, activeTab, selectedTematicaId, loadTematicaArea]);

  useEffect(() => {
    if (!selectedTematicaId) {
      setTematicaDetail(null);
    }
  }, [selectedTematicaId]);

  const onLogoutPress = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    try { logout(); } catch {}
    setTimeout(() => router.replace('/(auth)/login'), 0);
  };

  const handleRefresh = async () => {
    if (!adminToken) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadSets(),
        loadQuestions(),
        activeTab === 'analytics' ? loadAnalytics() : Promise.resolve(),
        activeTab === 'tematicas'
          ? (async () => {
              await loadTematicaAreas();
              if (selectedTematicaId) {
                await loadTematicaArea(selectedTematicaId, { silent: true, suppressToast: true });
              }
            })()
          : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const openSetModal = (set?: AdminTriviaSet) => {
    if (set) {
      setSetForm({
        id: set.id,
        title: set.title,
        description: set.description ?? '',
        topic: set.topic ?? '',
        active: set.active ?? true,
      });
    } else {
      setSetForm({ title: '', description: '', topic: '', active: true });
    }
    setSetModalVisible(true);
  };

  const handleSaveSet = async () => {
    if (!adminToken || !setForm.title.trim()) {
      showToast('error', 'El título es obligatorio');
      return;
    }
    try {
      await adminTriviaApi.saveSet(adminToken, {
        id: setForm.id,
        title: setForm.title.trim(),
        description: setForm.description?.trim(),
        topic: setForm.topic?.trim(),
        active: setForm.active,
      });
      showToast('success', 'Trivia guardada');
      setSetModalVisible(false);
      await loadSets();
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo guardar la trivia');
    }
  };

  const openQuestionModal = (question?: AdminTriviaQuestion) => {
    if (!selectedSetId && !question) {
      showToast('error', 'Primero selecciona un banco');
      return;
    }
    if (question) {
      setQuestionForm({
        id: question.id,
        setId: question.setId,
        prompt: question.prompt,
        topic: question.topic,
        difficulty: question.difficulty,
        active: question.active,
        options: question.options.length ? question.options : [defaultOption()],
      });
    } else {
      setQuestionForm(makeEmptyQuestion(selectedSetId!));
    }
    setQuestionModalVisible(true);
  };

  const updateQuestionForm = (partial: Partial<QuestionFormState>) => {
    setQuestionForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const updateOption = (index: number, next: Partial<AdminTriviaOption>) => {
    setQuestionForm((prev) => {
      if (!prev) return prev;
      const copy = [...prev.options];
      copy[index] = { ...copy[index], ...next };
      return { ...prev, options: copy };
    });
  };

  const addOption = () => {
    setQuestionForm((prev) => {
      if (!prev || prev.options.length >= 6) return prev;
      return { ...prev, options: [...prev.options, defaultOption()] };
    });
  };

  const removeOption = (index: number) => {
    setQuestionForm((prev) => {
      if (!prev || prev.options.length <= 2) return prev;
      const copy = [...prev.options];
      copy.splice(index, 1);
      return { ...prev, options: copy };
    });
  };

  const handleSaveQuestion = async () => {
    if (!adminToken || !questionForm) return;
    if (!questionForm.prompt.trim()) {
      showToast('error', 'La pregunta no puede estar vacía');
      return;
    }
    const hasValidOption = questionForm.options.some((o) => o.text.trim().length > 0 && o.correct);
    if (!hasValidOption) {
      showToast('error', 'Necesitas al menos una opción correcta');
      return;
    }
    // Filtrar solo las opciones que tienen texto
    const validOptions = questionForm.options
      .filter((opt) => opt.text.trim().length > 0)
      .map((opt) => ({
        id: opt.id,
        text: opt.text.trim(),
        correct: Boolean(opt.correct),
        explanation: opt.explanation?.trim() || null,
      }));
    
    const payload = {
      setId: questionForm.setId,
      questionId: questionForm.id,
      prompt: questionForm.prompt.trim(),
      topic: questionForm.topic?.trim() || null,
      difficulty: questionForm.difficulty?.trim() || null,
      active: questionForm.active,
      options: validOptions,
    };
    console.log('[handleSaveQuestion] Payload:', JSON.stringify(payload, null, 2));
    try {
      if (questionForm.id) {
        await adminTriviaApi.updateQuestion(adminToken, questionForm.id, payload);
      } else {
        await adminTriviaApi.createQuestion(adminToken, payload);
      }
      showToast('success', 'Pregunta guardada');
      setQuestionModalVisible(false);
      await loadQuestions(questionForm.setId);
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo guardar la pregunta');
    }
  };

  const handleDeleteQuestion = async (question: AdminTriviaQuestion) => {
    const confirmed = Platform.OS === 'web' 
      ? window.confirm('¿Eliminar pregunta? Esta acción no se puede deshacer.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Eliminar pregunta', 'Esta acción no se puede deshacer. ¿Continuar?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    
    if (!confirmed || !adminToken) return;
    
    try {
      await adminTriviaApi.deleteQuestion(adminToken, question.id);
      showToast('success', 'Pregunta eliminada');
      await loadQuestions(question.setId);
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo eliminar la pregunta');
    }
  };

  const openTematicaAreaModal = async (area?: TematicaAreaSummary | TematicaArea) => {
    if (!area) {
      setAreaForm(makeEmptyAreaForm());
      setTematicaAreaModalVisible(true);
      return;
    }
    let detail: TematicaArea | null = null;
    if ('resources' in area) {
      detail = area as TematicaArea;
    } else {
      detail = await loadTematicaArea(area.id, { silent: true, skipState: true });
    }
    if (!detail) return;
    setAreaForm({
      id: detail.id,
      name: detail.name,
      summary: detail.summary || '',
      accentColor: detail.accentColor || '',
      heroImage: detail.heroImage || '',
      tagline: detail.tagline || '',
      learningFocusText: (detail.learningFocus || []).join(', '),
    });
    setTematicaAreaModalVisible(true);
  };

  const handleSaveTematicaArea = async () => {
    if (!adminToken) return;
    if (!areaForm.name.trim()) {
      showToast('error', 'El nombre es obligatorio');
      return;
    }
    const learningFocus = areaForm.learningFocusText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    try {
      const saved = await adminTriviaApi.saveTematicaArea(adminToken, {
        id: areaForm.id,
        name: areaForm.name.trim(),
        summary: areaForm.summary?.trim(),
        accentColor: areaForm.accentColor?.trim(),
        heroImage: areaForm.heroImage?.trim(),
        tagline: areaForm.tagline?.trim(),
        learningFocus,
      });
      showToast('success', 'Temática guardada');
      setTematicaAreaModalVisible(false);
      setSelectedTematicaId(saved.id);
      setTematicaDetail(saved);
      await loadTematicaAreas();
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo guardar la temática');
    }
  };

  const openTematicaResourceModal = (resource?: TematicaResource) => {
    if (!selectedTematicaId) {
      showToast('error', 'Selecciona una temática primero');
      return;
    }
    if (resource) {
      setResourceForm({
        id: resource.id,
        areaId: selectedTematicaId,
        title: resource.title || '',
        shortDescription: resource.shortDescription || '',
        detailDescription: resource.detailDescription || '',
        imageUrl: resource.imageUrl || '',
        format: resource.format || '',
        estimatedTime: resource.estimatedTime || '',
        funFact: resource.funFact || '',
        deepDive: resource.deepDive || '',
        highlighted: resource.highlighted || false,
        sourcesText: (resource.sources || []).join(', '),
      });
    } else {
      setResourceForm(makeEmptyResourceForm(selectedTematicaId));
    }
    setTematicaResourceModalVisible(true);
  };

  const handleSaveTematicaResource = async () => {
    if (!adminToken) return;
    if (!resourceForm.areaId) {
      showToast('error', 'Selecciona una temática');
      return;
    }
    if (!resourceForm.title.trim()) {
      showToast('error', 'El recurso necesita un título');
      return;
    }
    const sources = resourceForm.sourcesText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    try {
      await adminTriviaApi.saveTematicaResource(adminToken, {
        id: resourceForm.id,
        areaId: resourceForm.areaId,
        title: resourceForm.title.trim(),
        shortDescription: resourceForm.shortDescription?.trim(),
        detailDescription: resourceForm.detailDescription?.trim(),
        imageUrl: resourceForm.imageUrl?.trim(),
        format: resourceForm.format?.trim(),
        estimatedTime: resourceForm.estimatedTime?.trim(),
        funFact: resourceForm.funFact?.trim(),
        deepDive: resourceForm.deepDive?.trim(),
        highlighted: resourceForm.highlighted,
        sources,
      });
      showToast('success', 'Recurso guardado');
      setTematicaResourceModalVisible(false);
      await loadTematicaArea(resourceForm.areaId);
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo guardar el recurso');
    }
  };

  const confirmDeleteTematicaResource = async (resource: TematicaResource) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Eliminar recurso? Esta acción no se puede deshacer.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Eliminar recurso', 'Esta acción no se puede deshacer. ¿Continuar?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    
    if (!confirmed || !adminToken || !resource.id) return;
    
    try {
      await adminTriviaApi.deleteTematicaResource(adminToken, resource.id);
      showToast('success', 'Recurso eliminado');
      if (selectedTematicaId) {
        await loadTematicaArea(selectedTematicaId, { silent: true, suppressToast: true });
      }
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo eliminar el recurso');
    }
  };

  const confirmDeleteTematicaArea = async (areaId: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Eliminar temática? Se eliminarán todos los recursos asociados.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Eliminar temática', 'Se eliminarán todos los recursos asociados. ¿Continuar?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    
    if (!confirmed || !adminToken) return;
    
    try {
      await adminTriviaApi.deleteTematicaArea(adminToken, areaId);
      showToast('success', 'Temática eliminada');
      if (selectedTematicaId === areaId) {
        setSelectedTematicaId(null);
        setTematicaDetail(null);
      }
      await loadTematicaAreas();
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo eliminar la temática');
    }
  };

  const currentSet = useMemo(() => sets.find((s) => s.id === selectedSetId), [sets, selectedSetId]);
  const activeSets = useMemo(() => sets.filter((s) => s.active !== false), [sets]);

  // Debugging: Log cuando cambia isAdmin o adminToken
  useEffect(() => {
    console.log('[Admin Panel Render Check] isAdmin:', isAdmin, 'adminToken:', adminToken ? 'present' : 'missing');
  }, [isAdmin, adminToken]);

  // Mostrar loading mientras verifica
  if (isVerifying) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f9f6', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#198754" />
        <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Verificando acceso...</Text>
      </View>
    );
  }

  if (!isAdmin || !adminToken) {
    console.log('[Admin Panel] Rendering access denied - isAdmin:', isAdmin, 'adminToken:', adminToken ? 'present' : 'missing');
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f9f6', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#ef4444', textAlign: 'center' }}>
          Acceso Denegado
        </Text>
        <Text style={{ marginTop: 12, color: '#64748b', textAlign: 'center' }}>
          No tienes permisos para acceder al panel de administración.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#198754', borderRadius: 10 }}
          onPress={onLogoutPress}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Panel administrativo</Text>
          <Text style={styles.headline}>Hola, {user?.fullName || user?.email}</Text>
          <Text style={styles.subtitle}>Gestiona retos, preguntas y resultados sin volver a desplegar.</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress} accessibilityLabel="Cerrar sesión" accessibilityRole="button">
          <Text style={styles.logoutLabel}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'overview', label: 'Trivias' },
          { key: 'questions', label: 'Preguntas' },
          { key: 'tematicas', label: 'Temáticas' },
          { key: 'analytics', label: 'Resultados' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.key as TabKey)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#198754" />}
      >
        {activeTab === 'overview' && (
          <View>
            <View style={styles.metricsRow}>
              <MetricCard label="Bancos activos" value={`${activeSets.length}/${sets.length}`} hint="Trivias visibles en la app" />
              <MetricCard
                style={styles.metricCardSpacing}
                label="Preguntas"
                value={`${questions.length}`}
                hint={currentSet ? `Dentro de "${currentSet.title}"` : 'Selecciona un banco'}
              />
            </View>

            <SectionHeader
              title="Banco de trivias"
              actionLabel="Nueva trivia"
              onAction={() => openSetModal()}
              loading={loadingSets}
            />

            {sets.length === 0 && !loadingSets && (
              <EmptyState message="Aún no hay trivias creadas" suggestion="Crea tu primera trivia para empezar." />
            )}

            {sets.map((set) => (
              <View key={set.id} style={[styles.card, selectedSetId === set.id && styles.cardSelected]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{set.title}</Text>
                    <Text style={styles.cardMeta}>{set.topic || 'Tema libre'}</Text>
                  </View>
                  <View style={[styles.badge, set.active === false ? styles.badgeMuted : styles.badgeSuccess]}>
                    <Text style={styles.badgeLabel}>{set.active === false ? 'Oculta' : 'Activa'}</Text>
                  </View>
                </View>
                {set.description ? <Text style={styles.cardDescription}>{set.description}</Text> : null}
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.secondaryButton, styles.cardActionButton]} onPress={() => openSetModal(set)}>
                    <Text style={styles.secondaryButtonLabel}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryGhostButton, styles.cardActionButton, styles.cardActionSpacing]}
                    onPress={() => { setSelectedSetId(set.id); setActiveTab('questions'); }}
                  >
                    <Text style={styles.primaryGhostButtonLabel}>Ver preguntas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'questions' && (
          <View>
            <SectionHeader
              title={currentSet ? `Banco: ${currentSet.title}` : 'Selecciona un banco'}
              actionLabel={currentSet ? 'Nueva pregunta' : undefined}
              onAction={currentSet ? () => openQuestionModal() : undefined}
              loading={loadingQuestions}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {sets.map((set, index) => (
                <TouchableOpacity
                  key={set.id}
                  style={[styles.chip, index > 0 && styles.chipSpacing, selectedSetId === set.id && styles.chipActive]}
                  onPress={() => setSelectedSetId(set.id)}
                >
                  <Text style={[styles.chipLabel, selectedSetId === set.id && styles.chipLabelActive]}>{set.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!currentSet && (
              <EmptyState message="Selecciona o crea un banco" suggestion="Necesitas un banco activo para gestionar preguntas." />
            )}

            {currentSet && (
              <View>
                {loadingQuestions && <ActivityIndicator color="#198754" style={{ marginVertical: 16 }} />}
                {!loadingQuestions && questions.length === 0 && (
                  <EmptyState message="Sin preguntas" suggestion="Agrega tu primera pregunta para este banco." />
                )}

                {questions.map((question) => (
                  <View key={question.id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.questionPrompt}>{question.prompt}</Text>
                        <Text style={styles.questionMeta}>
                          {question.topic || 'Sin tema'} • {question.difficulty || 'Normal'}
                        </Text>
                      </View>
                      <View style={[styles.badge, question.active ? styles.badgeSuccess : styles.badgeMuted]}>
                        <Text style={styles.badgeLabel}>{question.active ? 'Activa' : 'Oculta'}</Text>
                      </View>
                    </View>
                    {question.options.map((option) => (
                      <View key={option.id || option.text} style={styles.optionRow}>
                        <View style={[styles.optionBullet, option.correct ? styles.optionBulletSuccess : styles.optionBulletNeutral]} />
                        <Text style={styles.optionLabel}>{option.text || 'Sin texto'}</Text>
                      </View>
                    ))}
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={[styles.secondaryButton, styles.cardActionButton]} onPress={() => openQuestionModal(question)}>
                        <Text style={styles.secondaryButtonLabel}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dangerGhostButton, styles.cardActionButton, styles.cardActionSpacing]}
                        onPress={() => handleDeleteQuestion(question)}
                      >
                        <Text style={styles.dangerGhostLabel}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'tematicas' && (
          <View>
            <SectionHeader
              title="Temáticas"
              actionLabel="Nueva temática"
              onAction={() => openTematicaAreaModal()}
              loading={loadingTematicas}
            />

            {tematicaAreas.length === 0 && !loadingTematicas ? (
              <EmptyState message="Aún no hay temáticas" suggestion="Crea tu primera temática para mostrar contenidos." />
            ) : null}

            {tematicaAreas.map((area) => (
              <View key={area.id} style={[styles.card, selectedTematicaId === area.id && styles.cardSelected]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{area.name}</Text>
                    <Text style={styles.cardMeta}>{area.resourceCount} recursos</Text>
                    {area.summary ? (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {area.summary}
                      </Text>
                    ) : null}
                  </View>
                  {area.accentColor ? <View style={[styles.colorSwatchSmall, { backgroundColor: area.accentColor }]} /> : null}
                </View>
                {area.keywords?.length ? (
                  <View style={styles.tagList}>
                    {area.keywords.map((keyword) => (
                      <View key={keyword} style={styles.tagPill}>
                        <Text style={styles.tagLabel}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.cardActionButton]}
                    onPress={() => setSelectedTematicaId(area.id)}
                  >
                    <Text style={styles.secondaryButtonLabel}>Ver detalle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryGhostButton, styles.cardActionButton, styles.cardActionSpacing]}
                    onPress={() => openTematicaAreaModal(area)}
                  >
                    <Text style={styles.primaryGhostButtonLabel}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {loadingTematicaDetail ? <ActivityIndicator color="#198754" style={{ marginVertical: 24 }} /> : null}

            {!loadingTematicaDetail && tematicaDetail && (
              <View style={styles.detailCard}>
                <View style={styles.tematicaHeroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{tematicaDetail.name}</Text>
                    {tematicaDetail.tagline ? <Text style={styles.detailSubtitle}>{tematicaDetail.tagline}</Text> : null}
                    {tematicaDetail.summary ? (
                      <Text style={styles.detailSummary} numberOfLines={3}>
                        {tematicaDetail.summary}
                      </Text>
                    ) : null}
                    {tematicaDetail.heroImage ? (
                      <Text style={styles.detailMeta} numberOfLines={1}>
                        Hero: {tematicaDetail.heroImage}
                      </Text>
                    ) : null}
                  </View>
                  {tematicaDetail.accentColor ? (
                    <View style={[styles.colorSwatchLarge, { backgroundColor: tematicaDetail.accentColor }]} />
                  ) : null}
                </View>

                {tematicaDetail.learningFocus?.length ? (
                  <View style={styles.tagList}>
                    {tematicaDetail.learningFocus.map((focus) => (
                      <View key={focus} style={styles.tagPill}>
                        <Text style={styles.tagLabel}>{focus}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.cardActionButton]}
                    onPress={() => openTematicaAreaModal(tematicaDetail)}
                  >
                    <Text style={styles.secondaryButtonLabel}>Editar temática</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryGhostButton, styles.cardActionButton, styles.cardActionSpacing]}
                    onPress={() => openTematicaResourceModal()}
                  >
                    <Text style={styles.primaryGhostButtonLabel}>Nuevo recurso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dangerGhostButton, styles.cardActionButton]}
                    onPress={() => confirmDeleteTematicaArea(tematicaDetail.id)}
                  >
                    <Text style={styles.dangerGhostLabel}>Eliminar</Text>
                  </TouchableOpacity>
                </View>

                {tematicaDetail.resources?.length ? (
                  tematicaDetail.resources.map((resource) => (
                    <View key={resource.id} style={styles.resourceCard}>
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <Text style={styles.resourceMeta}>
                        {resource.format || 'Formato libre'} • {resource.estimatedTime || 'Tiempo variable'}
                      </Text>
                      {resource.shortDescription ? (
                        <Text style={styles.resourceDescription}>{resource.shortDescription}</Text>
                      ) : null}
                      {resource.detailDescription ? (
                        <Text style={styles.resourceDetail} numberOfLines={4}>
                          {resource.detailDescription}
                        </Text>
                      ) : null}
                      {resource.funFact ? <Text style={styles.resourceFact}>✨ {resource.funFact}</Text> : null}
                      {resource.deepDive ? (
                        <Text style={styles.resourceDeepDive} numberOfLines={4}>
                          {resource.deepDive}
                        </Text>
                      ) : null}
                      {resource.sources?.length ? (
                        <View style={styles.tagList}>
                          {resource.sources.map((source) => (
                            <View key={source} style={styles.tagPill}>
                              <Text style={styles.tagLabel}>{source}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={[styles.secondaryButton, styles.cardActionButton]}
                          onPress={() => openTematicaResourceModal(resource)}
                        >
                          <Text style={styles.secondaryButtonLabel}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.dangerGhostButton, styles.cardActionButton, styles.cardActionSpacing]}
                          onPress={() => confirmDeleteTematicaResource(resource)}
                        >
                          <Text style={styles.dangerGhostLabel}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <EmptyState message="Sin recursos" suggestion="Crea un recurso para esta temática." />
                )}
              </View>
            )}

            {!loadingTematicaDetail && !tematicaDetail && tematicaAreas.length > 0 ? (
              <EmptyState message="Selecciona una temática" suggestion="Toca cualquiera de la lista para ver sus recursos." />
            ) : null}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View>
            <SectionHeader title="Leaderboard" actionLabel="Actualizar" onAction={loadAnalytics} loading={loadingAnalytics} />
            {loadingAnalytics && <ActivityIndicator color="#198754" style={{ marginVertical: 16 }} />}
            {!loadingAnalytics && leaderboard.length === 0 && (
              <EmptyState message="Sin intentos aún" suggestion="Aún no hay datos de trivia." />
            )}
            {leaderboard.map((row) => (
              <AnalyticsRow key={row.userId} row={row} onPress={() => loadUserProgress(row.userId)} />
            ))}

            <SectionHeader title="Progreso del cohorte" />
            {cohortProgress.map((row) => (
              <View key={row.userId} style={styles.progressCard}>
                <Text style={styles.progressName}>{row.fullName || row.email}</Text>
                <Text style={styles.progressMeta}>
                  {row.totalAttempts} intentos • Mejor {Math.round(row.bestScore)}%
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round(row.avgScore))}%` }]} />
                </View>
                <TouchableOpacity style={styles.primaryGhostButton} onPress={() => loadUserProgress(row.userId)}>
                  <Text style={styles.primaryGhostButtonLabel}>Ver detalle</Text>
                </TouchableOpacity>
              </View>
            ))}

            {selectedUserProgress && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Detalle de {selectedUserProgress.fullName || selectedUserProgress.email}</Text>
                <Text style={styles.detailRow}>Intentos: {selectedUserProgress.totalAttempts}</Text>
                <Text style={styles.detailRow}>Promedio: {Math.round(selectedUserProgress.avgScore)}%</Text>
                <Text style={styles.detailRow}>Precisión: {Math.round(selectedUserProgress.accuracy * 100)}%</Text>
                {selectedUserProgress.lastAttemptAt && (
                  <Text style={styles.detailRow}>Último intento: {new Date(selectedUserProgress.lastAttemptAt).toLocaleString()}</Text>
                )}
                
                {loadingHistory ? (
                  <ActivityIndicator size="small" color="#34C759" style={{ marginTop: 20 }} />
                ) : userHistory.length > 0 ? (
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.chartTitle}>Evolución del puntaje (últimos 30 días)</Text>
                    {(() => {
                      const chartWidth = Dimensions.get('window').width - 80;
                      const chartHeight = 200;
                      const padding = { top: 20, right: 20, bottom: 30, left: 40 };
                      const plotWidth = chartWidth - padding.left - padding.right;
                      const plotHeight = chartHeight - padding.top - padding.bottom;
                      const maxScore = Math.max(...userHistory.map(h => h.avgScore), 100);
                      const minScore = Math.min(...userHistory.map(h => h.avgScore), 0);
                      const scoreRange = maxScore - minScore || 100;
                      
                      const points = userHistory.map((h, i) => ({
                        x: padding.left + (i / (userHistory.length - 1 || 1)) * plotWidth,
                        y: padding.top + plotHeight - ((h.avgScore - minScore) / scoreRange) * plotHeight,
                      }));
                      
                      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
                      
                      return (
                        <Svg width={chartWidth} height={chartHeight} style={{ backgroundColor: '#fff', borderRadius: 12 }}>
                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100].map(val => {
                            const y = padding.top + plotHeight - ((val - minScore) / scoreRange) * plotHeight;
                            return (
                              <Line key={val} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
                            );
                          })}
                          {/* Y axis labels */}
                          {[0, 25, 50, 75, 100].map(val => {
                            const y = padding.top + plotHeight - ((val - minScore) / scoreRange) * plotHeight;
                            return (
                              <SvgText key={`y-${val}`} x={padding.left - 10} y={y + 4} fontSize="10" fill="#64748b" textAnchor="end">
                                {val}%
                              </SvgText>
                            );
                          })}
                          {/* X axis labels */}
                          {userHistory.map((h, i) => {
                            if (userHistory.length > 10 && i % Math.ceil(userHistory.length / 6) !== 0) return null;
                            const date = new Date(h.date);
                            const x = padding.left + (i / (userHistory.length - 1 || 1)) * plotWidth;
                            return (
                              <SvgText key={`x-${i}`} x={x} y={chartHeight - 10} fontSize="10" fill="#64748b" textAnchor="middle">
                                {`${date.getDate()}/${date.getMonth() + 1}`}
                              </SvgText>
                            );
                          })}
                          {/* Line */}
                          <Polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#34C759" strokeWidth="3" />
                          {/* Points */}
                          {points.map((p, i) => (
                            <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#34C759" stroke="#fff" strokeWidth="2" />
                          ))}
                        </Svg>
                      );
                    })()}
                  </View>
                ) : (
                  <Text style={{ marginTop: 20, textAlign: 'center', color: '#666' }}>
                    No hay suficientes datos para mostrar la gráfica
                  </Text>
                )}
                
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedUserProgress(null)}>
                  <Text style={styles.secondaryButtonLabel}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={setModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{setForm.id ? 'Editar trivia' : 'Nueva trivia'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={setForm.title}
              onChangeText={(text) => setSetForm((prev) => ({ ...prev, title: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Tema"
              value={setForm.topic}
              onChangeText={(text) => setSetForm((prev) => ({ ...prev, topic: text }))}
            />
            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Descripción"
              multiline
              value={setForm.description}
              onChangeText={(text) => setSetForm((prev) => ({ ...prev, description: text }))}
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Trivia visible</Text>
              <Switch value={setForm.active} onValueChange={(value) => setSetForm((prev) => ({ ...prev, active: value }))} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.secondaryButton, styles.cardActionButton]} onPress={() => setSetModalVisible(false)}>
                <Text style={styles.secondaryButtonLabel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, styles.cardActionButton, styles.modalActionSpacing]} onPress={handleSaveSet}>
                <Text style={styles.primaryButtonLabel}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={questionModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCardScrollable}>
            {questionForm && (
              <View style={styles.modalCardFull}>
                <Text style={styles.modalTitle}>{questionForm.id ? 'Editar pregunta' : 'Nueva pregunta'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enunciado"
                  value={questionForm.prompt}
                  onChangeText={(text) => updateQuestionForm({ prompt: text })}
                />
                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.input, styles.inputHalf]}
                    placeholder="Tema"
                    value={questionForm.topic}
                    onChangeText={(text) => updateQuestionForm({ topic: text })}
                  />
                  <TextInput
                    style={[styles.input, styles.inputHalf, styles.inputSpacing]}
                    placeholder="Dificultad"
                    value={questionForm.difficulty}
                    onChangeText={(text) => updateQuestionForm({ difficulty: text })}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Pregunta activa</Text>
                  <Switch value={questionForm.active} onValueChange={(value) => updateQuestionForm({ active: value })} />
                </View>

                <Text style={styles.modalSubtitle}>Opciones</Text>
                {questionForm.options.map((option, idx) => (
                  <View key={idx} style={styles.optionEditor}>
                    <TouchableOpacity
                      style={[styles.correctToggle, option.correct && styles.correctToggleActive]}
                      onPress={() => updateOption(idx, { correct: !option.correct })}
                    >
                      <Text style={[styles.correctToggleLabel, option.correct && styles.correctToggleLabelActive]}>✔</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={styles.input}
                        placeholder={`Opción ${idx + 1}`}
                        value={option.text}
                        onChangeText={(text) => updateOption(idx, { text })}
                      />
                      <TextInput
                        style={[styles.input, { marginTop: 6 }]}
                        placeholder="Explicación (opcional)"
                        value={option.explanation}
                        onChangeText={(text) => updateOption(idx, { explanation: text })}
                      />
                    </View>
                    {questionForm.options.length > 2 && (
                      <TouchableOpacity style={styles.removeOption} onPress={() => removeOption(idx)}>
                        <Text style={styles.removeOptionLabel}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {questionForm.options.length < 6 && (
                  <TouchableOpacity style={styles.primaryGhostButton} onPress={addOption}>
                    <Text style={styles.primaryGhostButtonLabel}>Agregar opción</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.secondaryButton, styles.cardActionButton]} onPress={() => setQuestionModalVisible(false)}>
                    <Text style={styles.secondaryButtonLabel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryButton, styles.cardActionButton, styles.modalActionSpacing]} onPress={handleSaveQuestion}>
                    <Text style={styles.primaryButtonLabel}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={tematicaAreaModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{areaForm.id ? 'Editar temática' : 'Nueva temática'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={areaForm.name}
              onChangeText={(text) => setAreaForm((prev) => ({ ...prev, name: text }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Resumen"
              value={areaForm.summary}
              onChangeText={(text) => setAreaForm((prev) => ({ ...prev, summary: text }))}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Color de acento (#hex)"
                value={areaForm.accentColor}
                onChangeText={(text) => setAreaForm((prev) => ({ ...prev, accentColor: text }))}
              />
              <TextInput
                style={[styles.input, styles.inputHalf, styles.inputSpacing]}
                placeholder="Hero image URL"
                value={areaForm.heroImage}
                onChangeText={(text) => setAreaForm((prev) => ({ ...prev, heroImage: text }))}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Tagline"
              value={areaForm.tagline}
              onChangeText={(text) => setAreaForm((prev) => ({ ...prev, tagline: text }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Focos de aprendizaje (separados por comas)"
              value={areaForm.learningFocusText}
              onChangeText={(text) => setAreaForm((prev) => ({ ...prev, learningFocusText: text }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.cardActionButton]}
                onPress={() => setTematicaAreaModalVisible(false)}
              >
                <Text style={styles.secondaryButtonLabel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, styles.cardActionButton, styles.modalActionSpacing]}
                onPress={handleSaveTematicaArea}
              >
                <Text style={styles.primaryButtonLabel}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={tematicaResourceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCardScrollable}>
            <View style={styles.modalCardFull}>
              <Text style={styles.modalTitle}>{resourceForm.id ? 'Editar recurso' : 'Nuevo recurso'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Título"
                value={resourceForm.title}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, title: text }))}
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Descripción corta"
                value={resourceForm.shortDescription}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, shortDescription: text }))}
              />
              <TextInput
                style={[styles.input, { marginTop: 10, height: 100 }]}
                placeholder="Descripción detallada"
                multiline
                value={resourceForm.detailDescription}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, detailDescription: text }))}
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Imagen"
                value={resourceForm.imageUrl}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, imageUrl: text }))}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.inputHalf]}
                  placeholder="Formato"
                  value={resourceForm.format}
                  onChangeText={(text) => setResourceForm((prev) => ({ ...prev, format: text }))}
                />
                <TextInput
                  style={[styles.input, styles.inputHalf, styles.inputSpacing]}
                  placeholder="Tiempo estimado"
                  value={resourceForm.estimatedTime}
                  onChangeText={(text) => setResourceForm((prev) => ({ ...prev, estimatedTime: text }))}
                />
              </View>
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Fun fact"
                value={resourceForm.funFact}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, funFact: text }))}
              />
              <TextInput
                style={[styles.input, { marginTop: 10, height: 120 }]}
                placeholder="Deep dive"
                multiline
                value={resourceForm.deepDive}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, deepDive: text }))}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setResourceForm((prev) => ({ ...prev, highlighted: !prev.highlighted }))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 8,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 2,
                      borderColor: '#666',
                      borderRadius: 4,
                      marginRight: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: resourceForm.highlighted ? '#2196F3' : 'transparent',
                    }}
                  >
                    {resourceForm.highlighted && (
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 14 }}>Destacar recurso</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Fuentes (separadas por comas)"
                value={resourceForm.sourcesText}
                onChangeText={(text) => setResourceForm((prev) => ({ ...prev, sourcesText: text }))}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.cardActionButton]}
                  onPress={() => setTematicaResourceModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonLabel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, styles.cardActionButton, styles.modalActionSpacing]}
                  onPress={handleSaveTematicaResource}
                >
                  <Text style={styles.primaryButtonLabel}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const MetricCard = ({ label, value, hint, style }: { label: string; value: string; hint?: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.metricCard, style]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
  </View>
);

const SectionHeader = ({ title, actionLabel, onAction, loading }: { title: string; actionLabel?: string; onAction?: () => void; loading?: boolean }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionActionRow}>
      {loading ? <ActivityIndicator size="small" color="#198754" style={styles.sectionActionLoader} /> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.primaryGhostButton, styles.sectionActionButton]} onPress={onAction}>
          <Text style={styles.primaryGhostButtonLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const EmptyState = ({ message, suggestion }: { message: string; suggestion?: string }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>{message}</Text>
    {suggestion ? <Text style={styles.emptySubtitle}>{suggestion}</Text> : null}
  </View>
);

const AnalyticsRow = ({ row, onPress }: { row: AdminLeaderboardRow; onPress: () => void }) => (
  <TouchableOpacity style={styles.analyticsRow} onPress={onPress}>
    <View style={{ flex: 1 }}>
      <Text style={styles.analyticsName}>{row.fullName || row.email}</Text>
      <Text style={styles.analyticsMeta}>
        {row.attempts} intentos • Promedio {Math.round(row.avgScore)}%
      </Text>
    </View>
    <View style={styles.analyticsScore}>
      <Text style={styles.analyticsScoreLabel}>{Math.round(row.bestScore)}%</Text>
      <Text style={styles.analyticsScoreHint}>Mejor</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f9f6', padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  kicker: { fontSize: 13, color: '#4f9c6b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headline: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  subtitle: { color: '#475569', marginTop: 4 },
  logoutButton: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ef4444', borderRadius: 10, marginLeft: 16 },
  logoutLabel: { color: '#fff', fontWeight: '700' },
  tabRow: { flexDirection: 'row', marginBottom: 12, borderRadius: 12, backgroundColor: '#e2efe7', padding: 4 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#fff', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  tabLabel: { fontWeight: '600', color: '#4d7c5a' },
  tabLabelActive: { color: '#0f172a' },
  toast: { padding: 12, borderRadius: 10, marginBottom: 12 },
  toastText: { color: '#fff', fontWeight: '600' },
  toastError: { backgroundColor: '#ef4444' },
  toastSuccess: { backgroundColor: '#22c55e' },
  sectionActionRow: { flexDirection: 'row', alignItems: 'center' },
  sectionActionLoader: { marginRight: 12 },
  sectionActionButton: { marginLeft: 0 },
  metricsRow: { flexDirection: 'row' },
  metricCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  metricCardSpacing: { marginLeft: 12 },
  metricLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  metricValue: { fontSize: 26, fontWeight: '800', marginTop: 6, color: '#0f172a' },
  metricHint: { marginTop: 4, color: '#94a3b8' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 },
  cardSelected: { borderWidth: 2, borderColor: '#22c55e20' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardMeta: { color: '#64748b', marginTop: 2 },
  cardDescription: { marginTop: 8, color: '#475569' },
  cardActions: { flexDirection: 'row', marginTop: 12 },
  cardActionButton: { flex: 1 },
  cardActionSpacing: { marginLeft: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeMuted: { backgroundColor: '#e2e8f0' },
  badgeLabel: { fontWeight: '700', color: '#134e4a', fontSize: 12 },
  secondaryButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5f5', paddingVertical: 10, alignItems: 'center' },
  secondaryButtonLabel: { fontWeight: '700', color: '#0f172a' },
  primaryButton: { flex: 1, borderRadius: 10, backgroundColor: '#198754', paddingVertical: 12, alignItems: 'center' },
  primaryButtonLabel: { color: '#fff', fontWeight: '700' },
  primaryGhostButton: { borderRadius: 10, borderWidth: 1, borderColor: '#198754', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  primaryGhostButtonLabel: { color: '#198754', fontWeight: '700' },
  dangerGhostButton: { borderRadius: 10, borderWidth: 1, borderColor: '#f87171', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  dangerGhostLabel: { color: '#dc2626', fontWeight: '700' },
  primaryGhostButtonLabelActive: { color: '#fff' },
  chipsRow: { paddingVertical: 6, paddingRight: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e2efe7' },
  chipSpacing: { marginLeft: 10 },
  chipActive: { backgroundColor: '#198754' },
  chipLabel: { fontWeight: '700', color: '#198754' },
  chipLabelActive: { color: '#fff' },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 7, elevation: 1 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionPrompt: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  questionMeta: { color: '#94a3b8', marginTop: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  optionBullet: { width: 10, height: 10, borderRadius: 999, marginRight: 10 },
  optionBulletSuccess: { backgroundColor: '#22c55e' },
  optionBulletNeutral: { backgroundColor: '#cbd5f5' },
  optionLabel: { color: '#334155', flex: 1 },
  analyticsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  analyticsName: { fontWeight: '700', color: '#0f172a' },
  analyticsMeta: { color: '#64748b', marginTop: 4 },
  analyticsScore: { alignItems: 'flex-end' },
  analyticsScoreLabel: { fontSize: 20, fontWeight: '800', color: '#198754' },
  analyticsScoreHint: { fontSize: 12, color: '#94a3b8' },
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  progressName: { fontWeight: '700', color: '#111827' },
  progressMeta: { color: '#64748b', marginTop: 4 },
  progressBarTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, marginTop: 10 },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: '#198754' },
  detailCard: { backgroundColor: '#ecfdf5', borderRadius: 16, padding: 16, marginTop: 12 },
  detailTitle: { fontWeight: '700', color: '#047857', marginBottom: 8 },
  detailRow: { color: '#065f46', marginBottom: 4 },
  chartTitle: { fontWeight: '600', color: '#047857', marginBottom: 12, fontSize: 15 },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  emptySubtitle: { color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalCardFull: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  modalCardScrollable: { padding: 20, paddingBottom: 60 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  modalSubtitle: { fontWeight: '700', color: '#0f172a', marginTop: 12, marginBottom: 6 },
  modalActions: { flexDirection: 'row', marginTop: 12 },
  modalActionSpacing: { marginLeft: 12 },
  input: { borderWidth: 1, borderColor: '#d0d7e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a' },
  rowInputs: { flexDirection: 'row' },
  inputSpacing: { marginLeft: 10 },
  inputHalf: { flex: 1 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  switchLabel: { fontWeight: '600', color: '#0f172a' },
  optionEditor: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  correctToggle: { width: 34, height: 34, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5f5', justifyContent: 'center', alignItems: 'center', marginTop: 4, marginRight: 10 },
  correctToggleActive: { backgroundColor: '#22c55e30', borderColor: '#22c55e' },
  correctToggleLabel: { color: '#94a3b8', fontWeight: '700' },
  correctToggleLabelActive: { color: '#15803d' },
  removeOption: { width: 30, alignItems: 'center', paddingTop: 6 },
  removeOptionLabel: { color: '#ef4444', fontSize: 18 },
  colorSwatchSmall: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', marginLeft: 12 },
  colorSwatchLarge: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5f5', marginLeft: 12 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#dbeafe', borderRadius: 999, marginRight: 8, marginBottom: 8 },
  tagLabel: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  tematicaHeroRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  detailSubtitle: { color: '#475569', marginTop: 4, fontWeight: '600' },
  detailSummary: { color: '#475569', marginTop: 8 },
  detailMeta: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
  resourceCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginTop: 16 },
  resourceTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  resourceMeta: { color: '#64748b', marginTop: 4 },
  resourceDescription: { marginTop: 10, color: '#475569' },
  resourceDetail: { marginTop: 6, color: '#475569' },
  resourceFact: { marginTop: 6, color: '#15803d', fontWeight: '600' },
  resourceDeepDive: { marginTop: 6, color: '#0f172a' },
});
