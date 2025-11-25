# Implementación del Sistema de Ranking de Usuarios

## Resumen

Se ha implementado un sistema de ranking general para usuarios que balancea la cantidad de quizzes completados con el promedio y mejor puntaje obtenido.

## Cambios Realizados

### Backend

#### 1. Nuevo DTO: `UserRankingDto.java`
**Ubicación**: `backend/src/main/java/org/uniproject/SaviaU/dto/UserRankingDto.java`

Estructura de datos para representar la información de ranking de un usuario:
- `rank`: Posición en el ranking
- `userId`: ID del usuario
- `fullName`: Nombre completo
- `email`: Correo electrónico
- `totalQuizzes`: Total de quizzes completados
- `averageScore`: Promedio de puntajes
- `bestScore`: Mejor puntaje obtenido
- `rankingScore`: Puntaje calculado para el ranking

#### 2. Nuevo Endpoint: ProfileController
**Ubicación**: `backend/src/main/java/org/uniproject/SaviaU/controller/profile/ProfileController.java`

**Endpoint**: `GET /api/auth/ranking`
**Parámetros**:
- `accessToken` (required): Token de autenticación
- `limit` (optional, default=50): Número máximo de usuarios a retornar

#### 3. Servicio: OnboardingService
**Ubicación**: `backend/src/main/java/org/uniproject/SaviaU/service/profile/OnboardingService.java`

Nuevos métodos agregados:
- `getUserRanking(String accessToken, int limit)`: Calcula y retorna el ranking de usuarios
- `enrichWithProfiles(List<Map<String, Object>> stats)`: Enriquece estadísticas con información de perfil
- `toDouble(Object val)`: Convierte valores a double de forma segura

### Fórmula de Ranking

```
rankingScore = (averageScore × 0.4) + (bestScore × 0.3) + (normalizedQuizCount × 0.3)
```

**Distribución de pesos**:
- 40% - Promedio de puntajes (consistencia)
- 30% - Mejor puntaje (excelencia)
- 30% - Cantidad de quizzes normalizada (participación)

Esta fórmula asegura un balance entre:
- **Calidad**: Los usuarios con buenos promedios son recompensados
- **Excelencia**: Los mejores puntajes individuales cuentan
- **Participación**: Los usuarios activos tienen ventaja, pero de forma balanceada

### Frontend

#### 1. Servicio de Ranking
**Archivo**: `frontend/services/ranking.ts`

Funciones disponibles:
- `getUserRanking(accessToken, limit)`: Obtiene el ranking completo
- `getUserPosition(accessToken, userId)`: Busca la posición de un usuario específico
- `getTopUsers(accessToken, top)`: Obtiene los top N usuarios

#### 2. Componente de UI
**Archivo**: `frontend/components/ranking/RankingList.tsx`

Componente React que muestra:
- Lista de usuarios ordenados por ranking
- Medallas para el top 3 (🥇🥈🥉)
- Resaltado del usuario actual
- Estadísticas de cada usuario
- Loading y manejo de errores

### Documentación

**Archivo**: `backend/docs/ranking-api.md`

Documentación completa que incluye:
- Descripción del endpoint
- Parámetros y respuestas
- Fórmula de ranking explicada
- Ejemplos de uso (cURL, JavaScript, TypeScript)
- Casos de uso

## Ejemplo de Uso en Frontend

```typescript
import { RankingList } from '@/components/ranking/RankingList';

// En tu componente
<RankingList 
  accessToken={userToken}
  limit={50}
  currentUserId={userId}
/>
```

## Cómo Funciona

1. El usuario hace una petición al endpoint con su token de acceso
2. El sistema valida el token y obtiene todos los intentos de trivia recientes
3. Agrupa los intentos por usuario y calcula:
   - Total de quizzes completados
   - Promedio de puntajes
   - Mejor puntaje
4. Normaliza la cantidad de quizzes (0-100) respecto al usuario con más quizzes
5. Calcula el `rankingScore` usando la fórmula balanceada
6. Ordena los usuarios por `rankingScore` descendente
7. Enriquece con información de perfil (nombre, email)
8. Retorna el top N usuarios solicitados

## Beneficios del Sistema

1. **Justo**: No favorece solo a los que hacen más quizzes ni solo a los que tienen mejor puntaje
2. **Motivador**: Incentiva tanto la participación como la calidad de las respuestas
3. **Balanceado**: Los 3 factores tienen peso significativo pero ninguno domina
4. **Escalable**: Maneja grandes cantidades de usuarios eficientemente
5. **Tiempo real**: El ranking se actualiza con cada consulta

## Próximos Pasos Sugeridos

1. Agregar caché para optimizar consultas frecuentes
2. Implementar paginación para rankings muy grandes
3. Agregar filtros por carrera/universidad/semestre
4. Crear rankings por temas específicos
5. Implementar rankings semanales/mensuales
6. Agregar sistema de recompensas basado en posiciones

## Testing

Para probar el endpoint:

```bash
curl -X GET "http://localhost:8080/api/auth/ranking?accessToken=YOUR_TOKEN&limit=10"
```

O desde el navegador:
```
http://localhost:8080/api/auth/ranking?accessToken=YOUR_TOKEN&limit=10
```
