import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { retosStyles as styles } from '../../styles/retos.styles';
// Modo frontend-only: comentar servicios/BD
// import { triviaApi, TriviaQuestion, TriviaSet } from '../../services/trivia';
// import { useAuth } from '../../context/AuthContext';
// import { buildCorrectMapForSet } from '../../constants/triviaLocalKeys';

// Tipos locales para modo frontend-only
type LocalOption = { id: string; text: string };
type LocalQuestion = { id: string; prompt: string; options: LocalOption[]; correctOptionId: string; explanation?: string };
type LocalSet = { id: string; title: string; description?: string; questions: LocalQuestion[] };

// Dataset local: temas ambientales (cambio climático, energías, biodiversidad, residuos, agua, economía circular)
const LOCAL_SETS: LocalSet[] = [
  {
    id: 'clima-1',
    title: 'Cambio Climático I',
    description: 'Conceptos clave y metas globales',
    questions: [
      {
        id: 'q1',
        prompt: '¿Cuál es el principal gas de efecto invernadero de origen humano?',
        options: [
          { id: 'o1', text: 'Dióxido de carbono (CO₂)' },
          { id: 'o2', text: 'Nitrógeno (N₂)' },
          { id: 'o3', text: 'Oxígeno (O₂)' },
          { id: 'o4', text: 'Argón (Ar)' },
        ],
        correctOptionId: 'o1',
        explanation: 'El CO₂ es el GEI antropogénico dominante por combustibles fósiles y deforestación.',
      },
      {
        id: 'q2',
        prompt: 'Desde la era preindustrial, el aumento promedio de temperatura global ha sido aproximadamente…',
        options: [
          { id: 'o1', text: '0,5 °C' },
          { id: 'o2', text: '0,8 °C' },
          { id: 'o3', text: '1,2 °C' },
          { id: 'o4', text: '2,0 °C' },
        ],
        correctOptionId: 'o3',
        explanation: 'Estimaciones recientes sitúan el calentamiento en torno a 1,1–1,2 °C.',
      },
      {
        id: 'q3',
        prompt: '¿Cuál es el objetivo central del Acuerdo de París?',
        options: [
          { id: 'o1', text: 'Eliminar todas las emisiones para 2030' },
          { id: 'o2', text: 'Limitar el calentamiento por debajo de 3 °C' },
          { id: 'o3', text: 'Limitar el calentamiento muy por debajo de 2 °C y perseguir 1,5 °C' },
          { id: 'o4', text: 'Reducir solo el metano' },
        ],
        correctOptionId: 'o3',
        explanation: 'París busca mantener el calentamiento muy por debajo de 2 °C, aspirando a 1,5 °C.',
      },
      {
        id: 'q4',
        prompt: '¿Qué sector aporta la mayor parte de las emisiones globales de GEI?',
        options: [
          { id: 'o1', text: 'Agricultura' },
          { id: 'o2', text: 'Transporte' },
          { id: 'o3', text: 'Edificaciones' },
          { id: 'o4', text: 'Generación de energía (electricidad/calor)' },
        ],
        correctOptionId: 'o4',
        explanation: 'La generación de energía (electricidad y calor) concentra una gran fracción de emisiones.',
      },
      {
        id: 'q5',
        prompt: 'La acidificación de los océanos se debe principalmente a…',
        options: [
          { id: 'o1', text: 'Aumento de salinidad' },
          { id: 'o2', text: 'Absorción de CO₂ atmosférico' },
          { id: 'o3', text: 'Residuos plásticos' },
          { id: 'o4', text: 'Cambios en las mareas' },
        ],
        correctOptionId: 'o2',
        explanation: 'El CO₂ disuelto forma ácido carbónico, reduciendo el pH del océano.',
      },
      {
        id: 'q6',
        prompt: '¿Qué es la mitigación del cambio climático?',
        options: [
          { id: 'o1', text: 'Reducir emisiones y/o aumentar sumideros de GEI' },
          { id: 'o2', text: 'Adaptarse a impactos inevitables' },
          { id: 'o3', text: 'Solo plantar árboles' },
          { id: 'o4', text: 'Capturar lluvia' },
        ],
        correctOptionId: 'o1',
        explanation: 'Mitigar es disminuir fuentes o reforzar sumideros de GEI.',
      },
    ],
  },
  {
    id: 'renovables-1',
    title: 'Energías Renovables I',
    description: 'Solar, eólica y conceptos básicos',
    questions: [
      {
        id: 'q1',
        prompt: '¿Cuál de estas fuentes es típicamente intermitente?',
        options: [
          { id: 'o1', text: 'Solar fotovoltaica' },
          { id: 'o2', text: 'Hidroeléctrica de embalse' },
          { id: 'o3', text: 'Biomasa' },
          { id: 'o4', text: 'Geotermia' },
        ],
        correctOptionId: 'o1',
        explanation: 'La generación PV depende de la radiación solar y varía con nubes y día/noche.',
      },
      {
        id: 'q2',
        prompt: 'Un factor de capacidad típico de eólica onshore es alrededor de…',
        options: [
          { id: 'o1', text: '5 %' },
          { id: 'o2', text: '15 %' },
          { id: 'o3', text: '35 %' },
          { id: 'o4', text: '80 %' },
        ],
        correctOptionId: 'o3',
        explanation: 'Valores típicos oscilan ~25–40 % según sitio/tecnología.',
      },
      {
        id: 'q3',
        prompt: '¿Qué tecnología convierte directamente la luz en electricidad?',
        options: [
          { id: 'o1', text: 'Solar térmica' },
          { id: 'o2', text: 'Solar fotovoltaica' },
          { id: 'o3', text: 'Biogás' },
          { id: 'o4', text: 'Eólica' },
        ],
        correctOptionId: 'o2',
        explanation: 'La fotovoltaica aprovecha el efecto fotoeléctrico en celdas solares.',
      },
      {
        id: 'q4',
        prompt: 'Una ventaja de la solar térmica de concentración puede ser…',
        options: [
          { id: 'o1', text: 'Funciona sin radiación' },
          { id: 'o2', text: 'No requiere terreno' },
          { id: 'o3', text: 'No consume agua' },
          { id: 'o4', text: 'Permite almacenamiento térmico para calor/proceso' },
        ],
        correctOptionId: 'o4',
        explanation: 'El almacenamiento térmico facilita suministro más gestionable.',
      },
      {
        id: 'q5',
        prompt: 'El “net metering” se refiere a…',
        options: [
          { id: 'o1', text: 'Compensación de excedentes en la factura' },
          { id: 'o2', text: 'Medir CO₂ neto de una ciudad' },
          { id: 'o3', text: 'Tarifa fija a grandes consumidores' },
          { id: 'o4', text: 'Un tipo de panel transparente' },
        ],
        correctOptionId: 'o1',
        explanation: 'La energía inyectada se compensa con el consumo facturado.',
      },
      {
        id: 'q6',
        prompt: 'Un impacto a considerar en parques eólicos es…',
        options: [
          { id: 'o1', text: 'Ozono troposférico' },
          { id: 'o2', text: 'Colisión de aves y murciélagos' },
          { id: 'o3', text: 'Derrames de mercurio' },
          { id: 'o4', text: 'Radiación ionizante' },
        ],
        correctOptionId: 'o2',
        explanation: 'Se mitiga con ubicación, monitoreo y diseño adecuados.',
      },
    ],
  },
  {
    id: 'biodiversidad-1',
    title: 'Biodiversidad y Conservación',
    description: 'Conceptos, amenazas y gestión',
    questions: [
      {
        id: 'q1',
        prompt: 'La biodiversidad se refiere a la variedad de…',
        options: [
          { id: 'o1', text: 'Climas del planeta' },
          { id: 'o2', text: 'Rocas y minerales' },
          { id: 'o3', text: 'Genes, especies y ecosistemas' },
          { id: 'o4', text: 'Ciudades y carreteras' },
        ],
        correctOptionId: 'o3',
        explanation: 'Incluye diversidad genética, de especies y de ecosistemas.',
      },
      {
        id: 'q2',
        prompt: 'La principal causa de pérdida de biodiversidad global es…',
        options: [
          { id: 'o1', text: 'Meteoritos' },
          { id: 'o2', text: 'Cambio de uso del suelo/deforestación' },
          { id: 'o3', text: 'Turismo' },
          { id: 'o4', text: 'Ruido urbano' },
        ],
        correctOptionId: 'o2',
        explanation: 'La transformación de hábitats (deforestación) es un impulsor clave.',
      },
      {
        id: 'q3',
        prompt: 'Una especie “clave” (keystone) es aquella que…',
        options: [
          { id: 'o1', text: 'Tiene un impacto desproporcionado en su ecosistema' },
          { id: 'o2', text: 'Es la más abundante' },
          { id: 'o3', text: 'Es la más grande' },
          { id: 'o4', text: 'Solo vive en islas' },
        ],
        correctOptionId: 'o1',
        explanation: 'Aun con baja abundancia, su rol ecológico es crítico.',
      },
      {
        id: 'q4',
        prompt: 'Un corredor biológico sirve principalmente para…',
        options: [
          { id: 'o1', text: 'Incrementar lluvia' },
          { id: 'o2', text: 'Producir energía' },
          { id: 'o3', text: 'Capturar carbono' },
          { id: 'o4', text: 'Conectar hábitats y facilitar movimiento de especies' },
        ],
        correctOptionId: 'o4',
        explanation: 'Mantiene conectividad y flujo genético entre poblaciones.',
      },
      {
        id: 'q5',
        prompt: 'Una especie invasora es…',
        options: [
          { id: 'o1', text: 'Una especie endémica' },
          { id: 'o2', text: 'Una especie en peligro' },
          { id: 'o3', text: 'Una especie introducida que causa impactos negativos' },
          { id: 'o4', text: 'Una especie migratoria' },
        ],
        correctOptionId: 'o3',
        explanation: 'Se establece fuera de su rango natural y puede afectar ecosistemas.',
      },
      {
        id: 'q6',
        prompt: 'Las áreas protegidas ayudan a…',
        options: [
          { id: 'o1', text: 'Aumentar tráfico' },
          { id: 'o2', text: 'Conservar hábitats y servicios ecosistémicos' },
          { id: 'o3', text: 'Producir petróleo' },
          { id: 'o4', text: 'Generar CO₂' },
        ],
        correctOptionId: 'o2',
        explanation: 'Son herramientas clave de conservación in situ.',
      },
    ],
  },
  {
    id: 'residuos-1',
    title: 'Gestión de Residuos y Reciclaje',
    description: 'Jerarquía, conceptos y prácticas',
    questions: [
      {
        id: 'q1',
        prompt: 'La jerarquía de residuos prioriza, en orden…',
        options: [
          { id: 'o1', text: 'Prevención > Reutilización > Reciclaje > Valorización > Disposición' },
          { id: 'o2', text: 'Disposición > Reciclaje > Reutilización > Prevención' },
          { id: 'o3', text: 'Reciclaje > Prevención > Disposición > Valorización' },
          { id: 'o4', text: 'Valorización > Disposición > Prevención > Reciclaje' },
        ],
        correctOptionId: 'o1',
        explanation: 'La prevención es la mejor opción; el vertido, la última.',
      },
      {
        id: 'q2',
        prompt: 'El compostaje trata principalmente…',
        options: [
          { id: 'o1', text: 'Metales' },
          { id: 'o2', text: 'Residuos orgánicos' },
          { id: 'o3', text: 'Vidrio' },
          { id: 'o4', text: 'Plásticos duros' },
        ],
        correctOptionId: 'o2',
        explanation: 'Materia orgánica biodegradable para producir compost.',
      },
      {
        id: 'q3',
        prompt: 'El símbolo del “anillo de Möbius” indica…',
        options: [
          { id: 'o1', text: 'Biodegradabilidad' },
          { id: 'o2', text: 'Peligrosidad' },
          { id: 'o3', text: 'Reciclaje' },
          { id: 'o4', text: 'Reutilización obligatoria' },
        ],
        correctOptionId: 'o3',
        explanation: 'Identifica materiales reciclables/reciclados.',
      },
      {
        id: 'q4',
        prompt: '“Lixiviado” es…',
        options: [
          { id: 'o1', text: 'Un gas de vertedero' },
          { id: 'o2', text: 'Un fertilizante' },
          { id: 'o3', text: 'Un tipo de plástico' },
          { id: 'o4', text: 'Líquido percolado que arrastra contaminantes' },
        ],
        correctOptionId: 'o4',
        explanation: 'Se genera al percolar agua a través de residuos.',
      },
      {
        id: 'q5',
        prompt: 'La economía circular busca…',
        options: [
          { id: 'o1', text: 'Mantener productos y materiales en uso el mayor tiempo' },
          { id: 'o2', text: 'Aumentar vertederos' },
          { id: 'o3', text: 'Solo reciclar vidrio' },
          { id: 'o4', text: 'Prohibir todo empaque' },
        ],
        correctOptionId: 'o1',
        explanation: 'Prioriza diseño, reutilización, reparación, reciclaje.',
      },
      {
        id: 'q6',
        prompt: 'Los residuos electrónicos (e-waste) suelen contener…',
        options: [
          { id: 'o1', text: 'Solo papel' },
          { id: 'o2', text: 'Metales pesados y componentes peligrosos' },
          { id: 'o3', text: 'Únicamente plásticos biodegradables' },
          { id: 'o4', text: 'Agua destilada' },
        ],
        correctOptionId: 'o2',
        explanation: 'Requieren manejo y reciclaje especializado.',
      },
    ],
  },
  {
    id: 'agua-1',
    title: 'Agua y Océanos',
    description: 'Gestión del agua, ecosistemas y contaminación',
    questions: [
      {
        id: 'q1',
        prompt: 'El mayor uso de agua dulce a nivel global corresponde a…',
        options: [
          { id: 'o1', text: 'Agricultura' },
          { id: 'o2', text: 'Industria' },
          { id: 'o3', text: 'Uso doméstico' },
          { id: 'o4', text: 'Recreación' },
        ],
        correctOptionId: 'o1',
        explanation: 'El riego agrícola domina la demanda mundial de agua dulce.',
      },
      {
        id: 'q2',
        prompt: 'Las “zonas muertas” marinas se asocian principalmente a…',
        options: [
          { id: 'o1', text: 'Aumento de salinidad' },
          { id: 'o2', text: 'Mareas vivas' },
          { id: 'o3', text: 'Eutrofización por exceso de nutrientes' },
          { id: 'o4', text: 'Aumento de presión atmosférica' },
        ],
        correctOptionId: 'o3',
        explanation: 'El exceso de nutrientes provoca proliferación y consumo de oxígeno.',
      },
      {
        id: 'q3',
        prompt: 'Los manglares se destacan por…',
        options: [
          { id: 'o1', text: 'No tolerar el agua salobre' },
          { id: 'o2', text: 'Ser exclusivamente de alta montaña' },
          { id: 'o3', text: 'Producir petróleo' },
          { id: 'o4', text: 'Proteger costas y servir de criadero para muchas especies' },
        ],
        correctOptionId: 'o4',
        explanation: 'Amortiguan oleaje y son hábitats críticos para juveniles.',
      },
      {
        id: 'q4',
        prompt: 'Una desventaja de la desalinización es…',
        options: [
          { id: 'o1', text: 'Bajo consumo energético' },
          { id: 'o2', text: 'Alto consumo energético y salmuera' },
          { id: 'o3', text: 'Genera lluvia' },
          { id: 'o4', text: 'Captura CO₂' },
        ],
        correctOptionId: 'o2',
        explanation: 'La ósmosis inversa requiere energía y gestiona salmuera concentrada.',
      },
      {
        id: 'q5',
        prompt: 'La sobrepesca ocurre cuando…',
        options: [
          { id: 'o1', text: 'La captura excede el rendimiento máximo sostenible' },
          { id: 'o2', text: 'Se pesca solo de día' },
          { id: 'o3', text: 'Se usan redes verdes' },
          { id: 'o4', text: 'Se prohíben cuotas' },
        ],
        correctOptionId: 'o1',
        explanation: 'Reduce poblaciones por debajo de niveles recomendados.',
      },
      {
        id: 'q6',
        prompt: 'Los microplásticos son partículas de plástico de tamaño…',
        options: [
          { id: 'o1', text: 'Mayor a 5 cm' },
          { id: 'o2', text: 'Entre 5 y 10 cm' },
          { id: 'o3', text: 'Menor a 5 mm' },
          { id: 'o4', text: 'Exactamente 1 cm' },
        ],
        correctOptionId: 'o3',
        explanation: 'Se definen comúnmente como < 5 mm.',
      },
    ],
  },
  {
    id: 'economia-1',
    title: 'Economía Circular y Sostenibilidad',
    description: 'Conceptos de gestión y medición',
    questions: [
      {
        id: 'q1',
        prompt: 'El “triple resultado” (triple bottom line) se refiere a…',
        options: [
          { id: 'o1', text: 'Solo beneficio económico' },
          { id: 'o2', text: 'Personas, planeta y prosperidad (o beneficio)' },
          { id: 'o3', text: 'Solo innovación' },
          { id: 'o4', text: 'Solo biodiversidad' },
        ],
        correctOptionId: 'o2',
        explanation: 'Dimensiones social, ambiental y económica.',
      },
      {
        id: 'q2',
        prompt: 'El Análisis de Ciclo de Vida (ACV) evalúa…',
        options: [
          { id: 'o1', text: 'Impactos de un producto desde la cuna hasta la tumba' },
          { id: 'o2', text: 'Solo el costo financiero' },
          { id: 'o3', text: 'Colores de empaque' },
          { id: 'o4', text: 'Únicamente la etapa de uso' },
        ],
        correctOptionId: 'o1',
        explanation: 'Considera materias primas, producción, uso y fin de vida.',
      },
      {
        id: 'q3',
        prompt: 'El ecodiseño busca…',
        options: [
          { id: 'o1', text: 'Maximizar el peso' },
          { id: 'o2', text: 'Mayor consumo energético' },
          { id: 'o3', text: 'Reducir impactos ambientales desde el diseño' },
          { id: 'o4', text: 'Raer la funcionalidad' },
        ],
        correctOptionId: 'o3',
        explanation: 'Optimiza materiales, eficiencia y fin de vida.',
      },
      {
        id: 'q4',
        prompt: 'La huella de carbono cuantifica…',
        options: [
          { id: 'o1', text: 'Solo residuos sólidos' },
          { id: 'o2', text: 'Solo el agua consumida' },
          { id: 'o3', text: 'El ruido generado' },
          { id: 'o4', text: 'GEI totales, expresados como CO₂ equivalente' },
        ],
        correctOptionId: 'o4',
        explanation: 'Permite comparar emisiones agregadas de diferentes GEI.',
      },
      {
        id: 'q5',
        prompt: 'Los “alcances” 1, 2 y 3 en inventarios de GEI describen…',
        options: [
          { id: 'o1', text: 'Tipos de residuos' },
          { id: 'o2', text: 'Emisiones directas, energía adquirida y cadena de valor' },
          { id: 'o3', text: 'Tipos de bosques' },
          { id: 'o4', text: 'Clases de biodiversidad' },
        ],
        correctOptionId: 'o2',
        explanation: 'Scope 1 directas; 2 electricidad/calor adquiridos; 3 otras indirectas.',
      },
      {
        id: 'q6',
        prompt: 'Un sistema de certificación de edificios sostenibles es…',
        options: [
          { id: 'o1', text: 'LEED' },
          { id: 'o2', text: 'MERC' },
          { id: 'o3', text: 'ETC' },
          { id: 'o4', text: 'RWD' },
        ],
        correctOptionId: 'o1',
        explanation: 'LEED evalúa múltiples criterios de sostenibilidad en edificios.',
      },
    ],
  },
];

type AnswerState = {
  selectedOptionId: string | null;
  correctOptionId?: string | null;
  correct?: boolean;
  explanation?: string | null;
};

export default function Retos() {
  // const { supabaseAccessToken } = useAuth(); // Frontend-only: no requerido
  const { width } = useWindowDimensions();
  const isWide = width >= 1024; // diseño de 2 columnas en pantallas grandes

  // Carga de sets y selección
  const [loadingSets, setLoadingSets] = useState(true);
  const [sets, setSets] = useState<LocalSet[]>([]);
  const [setError, setSetError] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<LocalSet | null>(null);

  // Preguntas y respuestas
  const [questions, setQuestions] = useState<LocalQuestion[]>([]);
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
    // Frontend-only: cargar sets locales
    try {
      setLoadingSets(true);
      setSets(LOCAL_SETS);
    } catch (e: any) {
      setSetError(e?.message || 'No se pudo cargar los retos');
    } finally {
      setLoadingSets(false);
    }
  }, []);

  // 2) Al seleccionar un set, traer preguntas (sin revelar correctas)
  const loadQuestions = async (s: LocalSet) => {
    try {
      const qs = s.questions;
      try {
        console.log('[TRIVIA-FRONT] setId:', s.id);
        console.table(qs.map((q, i) => ({ i, qId: q.id, prompt: q.prompt, optionIds: q.options.map(o => o.id), correct: q.correctOptionId })));
      } catch {}
      setQuestions(qs);
      setTotalQuestions(qs.length);
      setQIndex(0);
      setAnswerState({ selectedOptionId: null });
      setSelectedSet(s);
      // construir mapa de respuestas correctas desde dataset local
      const correctMap: Record<string, string> = {};
      qs.forEach(q => { correctMap[q.id] = q.correctOptionId; });
      setLocalCorrectMap(correctMap);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar las preguntas');
    }
  };

  // 3) Iniciar intento cuando el usuario esté listo
  // Frontend-only: sin intento backend; se valida localmente con localCorrectMap
  const startAttempt = async () => {
    // No-op en modo frontend
    setScore(0);
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
        // Guardamos la explicación detallada de la pregunta para mostrarla bajo la pregunta
        explanation: currentQuestion.explanation || (isOk ? '¡Correcto!' : 'Respuesta incorrecta'),
      });
      if (isOk) setScore((s) => s + 1);
      return;
    }

    // Modo frontend-only: ya validamos arriba con localCorrectMap
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
    // finalizar (frontend-only)
    setShowResult(true);
  };

  // 6) UI de sets (listado para elegir)
  if (!selectedSet) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.cardRow}>
          <View style={[styles.cardLeft, styles.cardList]}>
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
                  <TouchableOpacity key={s.id} style={[styles.optionBtn, styles.optionList]} onPress={() => loadQuestions(s)}>
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
          <View style={styles.pointsBox}>
            <Text style={styles.pointsNumber}>{score} / {totalQuestions}</Text>
            <Text style={styles.pointsPercent}>{pct}%</Text>
          </View>
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

  // Imagen lateral por set usando archivos locales.
 
  const sideImageBySet: Record<string, ImageSourcePropType> = {
    'clima-1': require('../../assets/images/test1.png'),
    'renovables-1': require('../../assets/images/test2.png'),
    'biodiversidad-1': require('../../assets/images/test3.png'),
    'residuos-1': require('../../assets/images/test4.png'),
    'agua-1': require('../../assets/images/test5.png'),
    'economia-1': require('../../assets/images/test6.png'),
  };
  const sideImage: ImageSourcePropType | undefined = selectedSet ? sideImageBySet[selectedSet.id] : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.cardRow, isWide && { flexDirection: 'row', alignItems: 'stretch' }]}>
  <View style={[styles.cardLeft, isWide && { width: '60%', borderRightWidth: 0 }]}>
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
            <View style={[styles.feedbackBox, answerState.correct ? styles.feedbackSuccess : styles.feedbackDanger]}>
              <Text style={answerState.correct ? styles.feedbackCorrect : styles.feedbackWrong}>
                {answerState.correct ? '¡Correcto!' : 'Respuesta incorrecta'}
              </Text>
              {!!currentQuestion?.explanation && (
                <Text style={[styles.feedbackBody, { color: answerState.correct ? '#0f5132' : '#842029' }]}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>
          ) : null}

          {/* Banner de insignia desbloqueada (similar al diseño de referencia) */}
          {answerState.correct && qIndex === 0 ? (
            <View style={styles.badgeBanner}>
              <Text style={styles.badgeBannerText}>🏆 ¡INSIGNIA DESBLOQUEADA! - Primer desafío</Text>
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
              <TouchableOpacity style={styles.primaryBtn} onPress={startAttempt} disabled={starting}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{starting ? 'Iniciando...' : 'Comenzar'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {isWide ? (
          <View style={[styles.cardRight, { display: 'flex', width: '40%', padding: 12, justifyContent: 'center', alignItems: 'center' }]}>
            {sideImage ? (
              <Image
                source={sideImage}
                style={{ width: '100%', height: 520, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : null}
          </View>
        ) : null}
      </View>
      {/* Retroalimentación extendida debajo de la pregunta ya está incluida en el bloque feedbackBox */}
    </ScrollView>
  );
}

