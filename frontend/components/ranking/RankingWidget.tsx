// Componente de ranking para mostrar en el perfil
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getUserRanking } from '../../services/ranking';

interface UserRanking {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  rankingScore: number;
}

interface RankingWidgetProps {
  accessToken: string;
  currentUserId?: string;
  showTop?: number;
  onViewFull?: () => void;
}

export const RankingWidget: React.FC<RankingWidgetProps> = ({ 
  accessToken, 
  currentUserId,
  showTop = 10,
  onViewFull
}) => {
  const [ranking, setRanking] = useState<UserRanking[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRanking();
  }, [accessToken]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener el ranking completo
      const allRanking = await getUserRanking(accessToken, showTop);
      setRanking(allRanking);

      // Si hay un usuario actual, buscar su posición
      if (currentUserId) {
        const userInTop = allRanking.find(u => u.userId === currentUserId);
        if (userInTop) {
          setCurrentUserRank(userInTop);
        } else {
          // El usuario no está en el top, buscar en un rango más amplio
          try {
            const extendedRanking = await getUserRanking(accessToken, 100);
            const userRank = extendedRanking.find(u => u.userId === currentUserId);
            setCurrentUserRank(userRank || null);
          } catch (extErr) {
            console.warn('Could not find user in extended ranking:', extErr);
            setCurrentUserRank(null);
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading ranking:', err);
      setError(err?.message || 'No se pudo cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#198754" />
        <Text style={styles.loadingText}>Cargando ranking...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Posición del usuario actual */}
      {currentUserRank && (
        <View style={styles.currentUserCard}>
          <Text style={styles.currentUserLabel}>Tu posición</Text>
          <View style={styles.currentUserRow}>
            <Text style={styles.currentUserRank}>
              {getMedalEmoji(currentUserRank.rank) || `#${currentUserRank.rank}`}
            </Text>
            <View style={styles.currentUserInfo}>
              <Text style={styles.currentUserScore}>
                {currentUserRank.rankingScore.toFixed(1)} pts
              </Text>
              <Text style={styles.currentUserStats}>
                {currentUserRank.totalQuizzes} quizzes • {currentUserRank.averageScore.toFixed(1)}% promedio
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Top usuarios */}
      <View style={styles.topSection}>
        <Text style={styles.topTitle}>🏆 Top {showTop}</Text>
        {ranking.slice(0, 5).map((user, index) => {
          const isCurrentUser = user.userId === currentUserId;
          const medal = getMedalEmoji(user.rank);
          
          return (
            <View 
              key={user.userId} 
              style={[
                styles.rankItem,
                isCurrentUser && styles.rankItemCurrent
              ]}
            >
              <Text style={styles.rankNumber}>
                {medal || user.rank}
              </Text>
              <View style={styles.rankInfo}>
                <Text 
                  style={[
                    styles.rankName,
                    isCurrentUser && styles.rankNameCurrent
                  ]}
                  numberOfLines={1}
                >
                  {user.fullName || 'Usuario'}
                </Text>
                <Text style={styles.rankStats}>
                  {user.totalQuizzes} quizzes • {user.averageScore.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.rankScore}>{user.rankingScore.toFixed(1)}</Text>
            </View>
          );
        })}
      </View>

      {/* Botón para ver ranking completo */}
      {onViewFull && (
        <TouchableOpacity style={styles.viewFullButton} onPress={onViewFull}>
          <Text style={styles.viewFullText}>Ver ranking completo →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
  },
  currentUserCard: {
    backgroundColor: '#e6f4ec',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  currentUserLabel: {
    fontSize: 12,
    color: '#198754',
    fontWeight: '600',
    marginBottom: 6,
  },
  currentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRank: {
    fontSize: 32,
    marginRight: 12,
  },
  currentUserInfo: {
    flex: 1,
  },
  currentUserScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#198754',
    marginBottom: 2,
  },
  currentUserStats: {
    fontSize: 12,
    color: '#666',
  },
  topSection: {
    marginTop: 8,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f8f9fa',
  },
  rankItemCurrent: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    width: 36,
    color: '#666',
  },
  rankInfo: {
    flex: 1,
    marginLeft: 8,
  },
  rankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  rankNameCurrent: {
    color: '#1976d2',
  },
  rankStats: {
    fontSize: 11,
    color: '#999',
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#198754',
    marginLeft: 8,
  },
  viewFullButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#198754',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewFullText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
