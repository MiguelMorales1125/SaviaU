import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { retosStyles as styles } from '../../styles/retos.styles';

type Option = { id: string; text: string; correct?: boolean; feedback?: string };

const SAMPLE_QUESTIONS = [
  {
    id: 'r1',
    title: '¿Sabías que...?',
    question: 'El Ártico se está calentando al doble de rápido que el promedio mundial.',
    explainCorrect: 'Correcto. El Ártico se calienta 2–4 veces más rápido que el planeta por la “amplificación ártica”: menos hielo significa menos reflejo solar y mayor absorción de calor.',
    explainWrong: 'De hecho, el Ártico se calienta mucho más rápido que el promedio global debido a la pérdida de hielo marino y al aumento de la absorción de calor (amplificación ártica).',
    options: [
      { id: 'o1', text: 'Falso' },
      { id: 'o2', text: 'Cierto', correct: true, feedback: '¡Así es! Los estudios muestran una tasa de calentamiento de 2–4× en el Ártico.' },
      { id: 'o3', text: 'No estoy seguro' },
      { id: 'o4', text: 'Probablemente' },
    ] as Option[],
  },
  {
    id: 'r2',
    title: 'Medio ambiente',
    question: '¿Cuál es la principal causa del calentamiento global?',
    explainCorrect: 'Correcto. La quema de combustibles fósiles y la deforestación elevan las concentraciones de CO₂ y otros GEI, atrapando más calor en la atmósfera.',
    explainWrong: 'La principal causa actual es la actividad humana: combustibles fósiles y cambios de uso del suelo. Factores naturales como volcanes tienen efecto, pero mucho menor.',
    options: [
      { id: 'o1', text: 'Actividades humanas (combustibles fósiles)', correct: true, feedback: 'Exacto: CO₂, CH₄ y N₂O por energía, industria y transporte.' },
      { id: 'o2', text: 'Erupciones volcánicas', feedback: 'Los volcanes enfrían a corto plazo por aerosoles; no explican el calentamiento sostenido.' },
      { id: 'o3', text: 'Rotación de la Tierra' },
      { id: 'o4', text: 'Cambios en la órbita', feedback: 'Los ciclos orbitales operan a escalas de miles de años; no explican el calentamiento rápido actual.' },
    ] as Option[],
  },
  {
    id: 'r3',
    title: 'Energía',
    question: '¿Qué fuente de energía es renovable?',
    explainCorrect: 'Correcto. La energía solar es renovable y baja en emisiones durante su operación.',
    explainWrong: 'La respuesta correcta es “Energía solar”, ya que proviene de una fuente inagotable a escala humana.',
    options: [
      { id: 'o1', text: 'Carbón' },
      { id: 'o2', text: 'Petróleo' },
      { id: 'o3', text: 'Energía solar', correct: true, feedback: '¡Bien! Es una fuente limpia y renovable.' },
      { id: 'o4', text: 'Gas natural' },
    ] as Option[],
  },
  {
    id: 'r4',
    title: 'Biodiversidad',
    question: '¿Por qué es importante conservar bosques?',
    explainCorrect: 'Correcto. Los bosques almacenan carbono, regulan el ciclo del agua, protegen suelos y albergan gran parte de la biodiversidad.',
    explainWrong: 'Conservar bosques ayuda a regular el clima y proteger miles de especies; además almacenan carbono y mejoran la calidad del agua.',
    options: [
      { id: 'o1', text: 'Aumentan la desertificación' },
      { id: 'o2', text: 'Regulan el clima y conservan especies', correct: true, feedback: 'Exacto: capturan carbono y son hábitat clave.' },
      { id: 'o3', text: 'Disminuyen la calidad del agua' },
      { id: 'o4', text: 'Generan más CO2' },
    ] as Option[],
  },
];

export default function Retos() {
  const [index, setIndex] = useState(0);
  const q = SAMPLE_QUESTIONS[index];
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (opt: Option) => {
    if (selected) return; // one selection only for this simple UI
    setSelected(opt.id);
    if (opt.correct) {
      setScore((s) => s + 1);
    }
  };

  const finish = () => {
    // si hay más preguntas, avanzar
    if (index < SAMPLE_QUESTIONS.length - 1) {
      setIndex(index + 1);
      setSelected(null);
      return;
    }
    // al terminar el cuestionario evaluamos si se desbloquea la insignia
    const perfect = score === SAMPLE_QUESTIONS.length;
    setUnlocked(perfect);
    setShowResult(true);
  };

  if (showResult) {
    const total = SAMPLE_QUESTIONS.length;
    const pct = (score / total) * 100;
    let bannerText = '¡Sigue practicando!';
    let bannerColor = '#c0353a';
    if (pct === 100) { bannerText = '¡PERFECTO!'; bannerColor = '#198754'; }
    else if (pct >= 75) { bannerText = '¡Muy bien!'; bannerColor = '#198754'; }
    else if (pct >= 50) { bannerText = '¡Buen intento!'; bannerColor = '#f59e0b'; }

    return (
      <ScrollView style={styles.resultScreen} contentContainerStyle={styles.resultWrapper}>
        <Text style={styles.resultTitle}>¡Cuestionario Completado!</Text>
        <View style={styles.resultCard}>
          <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.resultIcon} resizeMode="contain" />
          <Text style={[styles.trophyText, { color: bannerColor }]}>{bannerText}</Text>
          <Text style={styles.pointsText}>{score * 850} puntos</Text>
          {unlocked ? (
            <View style={[styles.badgeBtn, styles.badgeUnlocked, { marginVertical: 12 }]}>
              <Text style={styles.badgeText}>🏅 INSIGNIA DESBLOQUEADA - Primer desafío</Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.continueBtn} onPress={() => { setShowResult(false); setSelected(null); setUnlocked(false); setScore(0); setIndex(0); }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      

      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>{q.title}</Text>
          <Text style={styles.question}>{q.question}</Text>

          {q.options.map((opt) => {
            const isSelected = selected === opt.id;
            const correct = !!opt.correct;
            const bg = selected
              ? isSelected
                ? correct
                  ? styles.optionCorrect
                  : styles.optionWrong
                : styles.optionDisabled
              : styles.option;

            return (
              <TouchableOpacity key={opt.id} style={[styles.optionBtn, bg]} onPress={() => handleSelect(opt)}>
                <Text style={styles.optionText}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}

          {selected ? (
            <View style={styles.feedbackBox}>
              {(() => {
                const sel = q.options.find(o => o.id === selected);
                const isOk = !!sel?.correct;
                const text = sel?.feedback ?? (isOk ? (q as any).explainCorrect : (q as any).explainWrong);
                if (isOk) return <Text style={styles.feedbackCorrect}>{text}</Text>;
                return <Text style={styles.feedbackWrong}>{text}</Text>;
              })()}
            </View>
          ) : null}

          {/* badge only appears on results screen */}

          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setSelected(null); setUnlocked(false); setScore(0); }}>
              <Text style={{ color: '#198754', fontWeight: '700' }}>Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={finish}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{index < SAMPLE_QUESTIONS.length - 1 ? 'Siguiente' : 'Finalizar reto'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

