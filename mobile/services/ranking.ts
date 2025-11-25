// Servicio para obtener el ranking de usuarios (versión mobile)
// Coloca este archivo en: mobile/services/ranking.ts

import { API_CONFIG } from '../config/api';

export interface UserRanking {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  rankingScore: number;
}

/**
 * Obtiene el ranking general de usuarios
 * @param accessToken - Token de acceso del usuario autenticado
 * @param limit - Número máximo de usuarios a obtener (default: 50)
 * @returns Lista de usuarios ordenados por ranking
 */
export const getUserRanking = async (
  accessToken: string,
  limit: number = 50
): Promise<UserRanking[]> => {
  try {
    const url = `${API_CONFIG.BASE_URL}/api/auth/ranking?accessToken=${encodeURIComponent(
      accessToken
    )}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener ranking: ${response.status}`);
    }

    const data: UserRanking[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getUserRanking:', error);
    throw error;
  }
};

/**
 * Busca la posición de un usuario específico en el ranking
 * @param accessToken - Token de acceso
 * @param userId - ID del usuario a buscar
 * @returns Información de ranking del usuario o null si no se encuentra
 */
export const getUserPosition = async (
  accessToken: string,
  userId: string
): Promise<UserRanking | null> => {
  try {
    // Obtener un ranking más amplio para encontrar al usuario
    const ranking = await getUserRanking(accessToken, 100);
    return ranking.find(user => user.userId === userId) || null;
  } catch (error) {
    console.error('Error en getUserPosition:', error);
    throw error;
  }
};

/**
 * Obtiene el top N usuarios del ranking
 * @param accessToken - Token de acceso
 * @param top - Número de top usuarios (default: 10)
 * @returns Lista de top usuarios
 */
export const getTopUsers = async (
  accessToken: string,
  top: number = 10
): Promise<UserRanking[]> => {
  try {
    const ranking = await getUserRanking(accessToken, top);
    return ranking.slice(0, top);
  } catch (error) {
    console.error('Error en getTopUsers:', error);
    throw error;
  }
};
