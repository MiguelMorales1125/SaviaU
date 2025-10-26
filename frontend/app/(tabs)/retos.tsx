import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { retosStyles as styles } from '../../styles/retos.styles';

type Option = { id: string; text: string; correct?: boolean };

const SAMPLE_QUESTIONS = [
  {
    id: 'r1',
    title: '¿Sabías que...?',
    question: 'El Ártico se está calentando al doble de rápido que el promedio mundial.',
    options: [
      { id: 'o1', text: 'Falso' },
      { id: 'o2', text: 'Cierto', correct: true },
      { id: 'o3', text: 'No estoy seguro' },
      { id: 'o4', text: 'Probablemente' },
    ] as Option[],
  },
  {
    id: 'r2',
    title: 'Medio ambiente',
    question: '¿Cuál es la principal causa del calentamiento global?',
    options: [
      { id: 'o1', text: 'Actividades humanas (combustibles fósiles)', correct: true },
      { id: 'o2', text: 'Erupciones volcánicas' },
      { id: 'o3', text: 'Rotación de la Tierra' },
      { id: 'o4', text: 'Cambios en la órbita' },
    ] as Option[],
  },
  {
    id: 'r3',
    title: 'Energía',
    question: '¿Qué fuente de energía es renovable?',
    options: [
      { id: 'o1', text: 'Carbón' },
      { id: 'o2', text: 'Petróleo' },
      { id: 'o3', text: 'Energía solar', correct: true },
      { id: 'o4', text: 'Gas natural' },
    ] as Option[],
  },
  {
    id: 'r4',
    title: 'Biodiversidad',
    question: '¿Por qué es importante conservar bosques?',
    options: [
      { id: 'o1', text: 'Aumentan la desertificación' },
      { id: 'o2', text: 'Regulan el clima y conservan especies', correct: true },
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
    return (
      <ScrollView contentContainerStyle={styles.resultWrapper}>
        <Text style={styles.resultTitle}>¡Cuestionario Completado!</Text>
        <View style={styles.resultCard}>
          <Image source={require('../../assets/images/Logo-SaviaU.png')} style={styles.resultIcon} resizeMode="contain" />
          <Text style={styles.trophyText}>¡PERFECTO!</Text>
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
              {q.options.find(o => o.id === selected)?.correct ? (
                <Text style={styles.feedbackCorrect}>¡Correcto! {"\n"}El Ártico se calienta más rápido.</Text>
              ) : (
                <Text style={styles.feedbackWrong}>No es correcto. Intenta revisar las lecturas sobre cambio climático.</Text>
              )}
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

