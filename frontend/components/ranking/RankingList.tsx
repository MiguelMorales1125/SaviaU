// Componente de ejemplo para mostrar el ranking
// Coloca este archivo en: frontend/components/ranking/RankingList.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getUserRanking, UserRanking } from '../../services/ranking';

interface RankingListProps {
  accessToken: string;
  limit?: number;
  currentUserId?: string;
}

export const RankingList: React.FC<RankingListProps> = ({ 
  accessToken, 
  limit = 50,
  currentUserId 
}) => {
  const [ranking, setRanking] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRanking();
  }, [accessToken, limit]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserRanking(accessToken, limit);
      setRanking(data);
    } catch (err) {
      setError('Error al cargar el ranking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderRankingItem = ({ item }: { item: UserRanking }) => {
    const isCurrentUser = item.userId === currentUserId;
    
    return (
      <View style={[
        styles.rankingItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        {/* Medalla para top 3 */}
        <View style={styles.rankColumn}>
          {item.rank === 1 && <Text style={styles.medalGold}>🥇</Text>}
          {item.rank === 2 && <Text style={styles.medalSilver}>🥈</Text>}
          {item.rank === 3 && <Text style={styles.medalBronze}>🥉</Text>}
          {item.rank > 3 && <Text style={styles.rankNumber}>{item.rank}</Text>}
        </View>

        {/* Información del usuario */}
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            isCurrentUser && styles.currentUserText
          ]}>
            {item.fullName || 'Usuario'}
          </Text>
          <Text style={styles.userStats}>
            {item.totalQuizzes} quizzes • Promedio: {item.averageScore.toFixed(1)}%
          </Text>
        </View>

        {/* Puntaje de ranking */}
        <View style={styles.scoreColumn}>
          <Text style={styles.rankingScore}>
            {item.rankingScore.toFixed(1)}
          </Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando ranking...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Ranking General</Text>
      <Text style={styles.subtitle}>
        Top {ranking.length} usuarios por desempeño balanceado
      </Text>
      
      <FlatList
        data={ranking}
        renderItem={renderRankingItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rankColumn: {
    width: 50,
    alignItems: 'center',
  },
  medalGold: {
    fontSize: 32,
  },
  medalSilver: {
    fontSize: 32,
  },
  medalBronze: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  userStats: {
    fontSize: 13,
    color: '#666',
  },
  scoreColumn: {
    alignItems: 'center',
    marginLeft: 10,
  },
  rankingScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#999',
  },
});
