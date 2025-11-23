import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tematicasApi, TematicaAreaSummary, TematicaArea, TematicaResource } from '../../services/tematicas';
import { tematicasStyles } from '../../styles/tematicas.styles';

export default function Tematicas() {
  const [areas, setAreas] = useState<TematicaAreaSummary[]>([]);
  const [selectedArea, setSelectedArea] = useState<TematicaArea | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<TematicaResource | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingAreas(true);
        const result = await tematicasApi.getAreas();
        setAreas(result);
      } catch (err) {
        console.error('[Tematicas] getAreas error', err);
        setError('No pudimos cargar las áreas temáticas. Intenta nuevamente.');
      } finally {
        setLoadingAreas(false);
      }
    })();
  }, []);

  const openArea = async (areaId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await tematicasApi.getArea(areaId);
      setSelectedArea(detail);
      setSelectedArticle(null);
      setError(null);
    } catch (err) {
      console.error('[Tematicas] getArea error', err);
      setError('No pudimos abrir esta temática por ahora.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    // Al cambiar de temática se limpia cualquier artículo abierto
    setSelectedArticle(null);
  }, [selectedArea?.id]);

  const renderAreaCard = (area: TematicaAreaSummary) => (
    <TouchableOpacity
      key={area.id}
      style={[tematicasStyles.areaCard, { backgroundColor: area.accentColor + '22' }]}
      onPress={() => openArea(area.id)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: area.heroImage }} style={tematicasStyles.areaCardImage} />
      <Text style={tematicasStyles.areaCardTitle}>{area.name}</Text>
      <Text style={tematicasStyles.areaCardSummary}>{area.summary}</Text>
      <View style={tematicasStyles.badgeRow}>
        <Text style={tematicasStyles.badge}>{area.resourceCount} opciones</Text>
        {area.keywords.slice(0, 2).map((keyword) => (
          <Text key={keyword} style={tematicasStyles.badge}>{keyword}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderResourceCard = (resource: TematicaResource) => (
    <TouchableOpacity
      key={resource.id}
      style={tematicasStyles.resourceCard}
      activeOpacity={0.95}
      onPress={() => setSelectedArticle(resource)}
    >
      <Image source={{ uri: resource.imageUrl }} style={tematicasStyles.resourceImage} />
      <View style={tematicasStyles.resourceBody}>
        <View style={tematicasStyles.resourceTitleRow}>
          <Text style={tematicasStyles.resourceTitle}>{resource.title}</Text>
          <Text style={tematicasStyles.resourceMeta}>{resource.format} • {resource.estimatedTime}</Text>
        </View>
        <Text style={tematicasStyles.resourceShort}>{resource.shortDescription}</Text>
        <View style={tematicasStyles.articleCTA}>
          <Text style={tematicasStyles.articleCTAText}>Leer historia completa</Text>
          <Ionicons name="arrow-forward-circle" size={22} color="#1F8A70" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArticleDetail = () => {
    if (!selectedArea || !selectedArticle) return null;
    const deepDiveParagraphs = (selectedArticle.deepDive || '').split(/\n\n+/).filter(Boolean);
    return (
      <View style={tematicasStyles.detailContainer}>
        <TouchableOpacity style={tematicasStyles.articleBackRow} onPress={() => setSelectedArticle(null)}>
          <Ionicons name="arrow-back" size={18} color="#1F8A70" />
          <Text style={[tematicasStyles.backButtonText, { marginLeft: 8 }]}>Volver a {selectedArea.name}</Text>
        </TouchableOpacity>
        <View style={tematicasStyles.articleHeroCard}>
          <Image source={{ uri: selectedArticle.imageUrl }} style={tematicasStyles.heroImage} />
          <View style={tematicasStyles.heroContent}>
            <Text style={tematicasStyles.articleDetailTitle}>{selectedArticle.title}</Text>
            <Text style={tematicasStyles.heroSummary}>{selectedArticle.detailDescription}</Text>
          </View>
        </View>

        <View style={tematicasStyles.articleFunFactCard}>
          <Text style={tematicasStyles.articleFunFactLabel}>Dato curioso</Text>
          <Text style={tematicasStyles.articleFunFactText}>{selectedArticle.funFact}</Text>
        </View>

        <Text style={tematicasStyles.articleSectionLabel}>Explora en profundidad</Text>
        <Text style={tematicasStyles.detailText}>{selectedArticle.detailDescription}</Text>
        {deepDiveParagraphs.map((paragraph, idx) => (
          <Text key={idx} style={tematicasStyles.articleBodyText}>{paragraph}</Text>
        ))}

        <Text style={tematicasStyles.articleSectionLabel}>Fuentes recomendadas</Text>
        {selectedArticle.sources.map((source) => (
          <Text key={source} style={tematicasStyles.articleSourceItem}>{source}</Text>
        ))}
      </View>
    );
  };

  const renderDetail = () => {
    if (!selectedArea) return null;
    if (selectedArticle) {
      return renderArticleDetail();
    }
    return (
      <View style={tematicasStyles.detailContainer}>
        <TouchableOpacity style={tematicasStyles.backButton} onPress={() => { setSelectedArea(null); setSelectedArticle(null); }}>
          <Text style={tematicasStyles.backButtonText}>← Volver a las áreas</Text>
        </TouchableOpacity>
        <View style={[tematicasStyles.heroCard, { borderColor: selectedArea.accentColor }]}>
          <Image source={{ uri: selectedArea.heroImage }} style={tematicasStyles.heroImage} />
          <View style={tematicasStyles.heroContent}>
            <Text style={tematicasStyles.heroTagline}>{selectedArea.name}</Text>
            <Text style={tematicasStyles.heroSummary}>{selectedArea.tagline}</Text>
            <Text style={tematicasStyles.heroSummary}>{selectedArea.summary}</Text>
            <Text style={tematicasStyles.focusLabel}>Áreas de enfoque</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {selectedArea.learningFocus.map((focus) => (
                <Text key={focus} style={tematicasStyles.focusChip}>{focus}</Text>
              ))}
            </View>
          </View>
        </View>

        {selectedArea.resources.map(renderResourceCard)}
      </View>
    );
  };

  if (loadingAreas && !areas.length) {
    return (
      <View style={tematicasStyles.loader}>
        <ActivityIndicator size="large" color="#1F8A70" />
        <Text style={{ marginTop: 12, color: '#4A6572' }}>Conectando con las temáticas...</Text>
      </View>
    );
  }

  return (
    <View style={tematicasStyles.screen}>
      <ScrollView contentContainerStyle={tematicasStyles.scrollArea}>
        <View style={tematicasStyles.header}>
          <Text style={tematicasStyles.modulePill}>MÓDULO VIVO</Text>
          <Text style={tematicasStyles.heroTitle}>Explora áreas temáticas para aprender haciendo</Text>
          <Text style={tematicasStyles.heroSubtitle}>
            Cada área desbloquea experiencias, herramientas y datos curiosos para compartir con tu comunidad.
          </Text>
        </View>

        {error ? <Text style={tematicasStyles.errorText}>{error}</Text> : null}
        {loadingDetail ? (
          <View style={tematicasStyles.loader}>
            <ActivityIndicator size="small" color="#1F8A70" />
          </View>
        ) : null}

        {selectedArea ? (
          renderDetail()
        ) : (
          <View style={tematicasStyles.areaGrid}>
            {areas.map(renderAreaCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
