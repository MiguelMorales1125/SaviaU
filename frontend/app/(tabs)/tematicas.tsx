import React from 'react';
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { tabsStyles } from '../../styles/tabs.styles';

interface TematicaCard {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const tematicasData: TematicaCard[] = [
  {
    id: '1',
    title: 'Cambio',
    subtitle: 'climático',
    icon: 'thermometer-outline',
    color: '#FF6B6B'
  },
  {
    id: '2',
    title: 'Calidad',
    subtitle: 'del aire',
    icon: 'cloud-outline',
    color: '#4ECDC4'
  },
  {
    id: '3',
    title: 'Salud del',
    subtitle: 'suelo',
    icon: 'leaf-outline',
    color: '#F9E79F'
  },
  {
    id: '4',
    title: 'Biodiversidad',
    subtitle: '',
    icon: 'flower-outline',
    color: '#58A55C'
  },
  {
    id: '5',
    title: 'Bioindicadores',
    subtitle: '',
    icon: 'bug-outline',
    color: '#6BAE6B'
  },
  {
    id: '6',
    title: 'Recursos',
    subtitle: 'hídricos',
    icon: 'water-outline',
    color: '#5DADE2'
  },
  {
    id: '7',
    title: 'Seguridad',
    subtitle: 'alimentaria',
    icon: 'nutrition-outline',
    color: '#F7DC6F'
  },
  {
    id: '8',
    title: 'Bioindicadores',
    subtitle: '',
    icon: 'analytics-outline',
    color: '#82C47E'
  },
  {
    id: '9',
    title: 'Otros temas...',
    subtitle: '',
    icon: 'ellipsis-horizontal',
    color: '#85929E'
  },
  {
    id: '10',
    title: '•••',
    subtitle: '',
    icon: 'add-outline',
    color: '#2C3E50'
  }
];

export default function Tematicas() {
  const handleTematicaPress = (tematica: TematicaCard) => {
    console.log('Temática seleccionada:', tematica.title);
    
  };

  const renderTematicaCard = (item: TematicaCard) => (
    <TouchableOpacity
      key={item.id}
      style={[tabsStyles.tematicasCard, { backgroundColor: item.color }]}
      onPress={() => handleTematicaPress(item)}
      activeOpacity={0.8}
    >
      <View style={tabsStyles.tematicasIconContainer}>
        <Ionicons name={item.icon} size={28} color="white" />
      </View>
      <View style={tabsStyles.tematicasTextContainer}>
        <Text style={tabsStyles.tematicasCardTitle}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={tabsStyles.tematicasCardSubtitle}>{item.subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={tabsStyles.tematicasContainer}>
      <View style={tabsStyles.tematicasHeader}>
        <Text style={tabsStyles.tematicasModuleTitle}>MÓDULO 2</Text>
        <Text style={tabsStyles.tematicasTitle}>ÁREAS TEMÁTICAS DE LA</Text>
        <Text style={tabsStyles.tematicasTitle}>EDUCACIÓN AMBIENTAL</Text>
      </View>
      
      <View style={tabsStyles.tematicasGrid}>
        {tematicasData.map(renderTematicaCard)}
      </View>
    </View>
  );
}
