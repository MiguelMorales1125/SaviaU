# API de Ranking de Usuarios

## Endpoint: GET /api/auth/ranking

Obtiene el ranking general de usuarios basado en su desempeño en los quizzes.

### Descripción

Este endpoint calcula y retorna un ranking de usuarios que balancea tanto la cantidad de quizzes completados como la calidad de sus respuestas. El sistema de puntuación está diseñado para recompensar tanto la consistencia (promedio) como la excelencia (mejor puntaje) y la participación activa (cantidad de quizzes).

### Parámetros de Query

| Parámetro | Tipo | Requerido | Valor por defecto | Descripción |
|-----------|------|-----------|-------------------|-------------|
| `accessToken` | string | Sí | - | Token de acceso del usuario autenticado |
| `limit` | integer | No | 50 | Número máximo de usuarios a retornar en el ranking |

### Fórmula de Ranking

El puntaje de ranking se calcula con la siguiente fórmula balanceada:

```
rankingScore = (averageScore × 0.4) + (bestScore × 0.3) + (normalizedQuizCount × 0.3)
```

Donde:
- **averageScore** (40%): Promedio de todos los puntajes obtenidos en quizzes
- **bestScore** (30%): El mejor puntaje obtenido en un quiz
- **normalizedQuizCount** (30%): Cantidad de quizzes completados, normalizada respecto al usuario con más quizzes (0-100)

Esta fórmula asegura que:
- Los usuarios con buenos promedios sean recompensados (consistencia)
- Los usuarios que han alcanzado la excelencia en al menos un quiz sean reconocidos
- Los usuarios activos que completan muchos quizzes tengan ventaja, pero sin dominar completamente el ranking

### Respuesta Exitosa

**Status Code:** 200 OK

```json
[
  {
    "rank": 1,
    "userId": "uuid-del-usuario",
    "fullName": "Juan Pérez",
    "email": "juan.perez@universidad.edu",
    "totalQuizzes": 45,
    "averageScore": 87.5,
    "bestScore": 98.0,
    "rankingScore": 92.3
  },
  {
    "rank": 2,
    "userId": "uuid-del-usuario-2",
    "fullName": "María González",
    "email": "maria.gonzalez@universidad.edu",
    "totalQuizzes": 38,
    "averageScore": 89.2,
    "bestScore": 95.5,
    "rankingScore": 91.8
  }
]
```

### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `rank` | integer | Posición del usuario en el ranking (1 = primer lugar) |
| `userId` | string | ID único del usuario |
| `fullName` | string | Nombre completo del usuario |
| `email` | string | Correo electrónico del usuario |
| `totalQuizzes` | integer | Cantidad total de quizzes completados por el usuario |
| `averageScore` | double | Promedio de puntajes en todos los quizzes (0-100) |
| `bestScore` | double | Mejor puntaje obtenido en un quiz (0-100) |
| `rankingScore` | double | Puntaje calculado para el ranking (0-100) |

### Respuesta de Error

**Status Code:** 400 Bad Request

```json
{}
```

### Ejemplo de Uso

#### cURL
```bash
curl -X GET "http://localhost:8080/api/auth/ranking?accessToken=your-access-token&limit=20"
```

#### JavaScript (Fetch API)
```javascript
const accessToken = "your-access-token";
const limit = 20;

fetch(`http://localhost:8080/api/auth/ranking?accessToken=${accessToken}&limit=${limit}`)
  .then(response => response.json())
  .then(data => {
    console.log("Ranking:", data);
    data.forEach(user => {
      console.log(`${user.rank}. ${user.fullName} - Score: ${user.rankingScore.toFixed(2)}`);
    });
  })
  .catch(error => console.error("Error:", error));
```

#### TypeScript (React/React Native)
```typescript
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

const fetchRanking = async (accessToken: string, limit: number = 50): Promise<UserRanking[]> => {
  try {
    const response = await fetch(
      `http://localhost:8080/api/auth/ranking?accessToken=${accessToken}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch ranking');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ranking:', error);
    throw error;
  }
};
```

### Notas Importantes

1. **Autenticación**: Se requiere un token de acceso válido para utilizar este endpoint
2. **Límite de usuarios**: El parámetro `limit` está limitado a un máximo de 2000 usuarios por razones de rendimiento
3. **Actualización**: El ranking se calcula en tiempo real cada vez que se hace la consulta
4. **Privacidad**: Solo se muestran datos públicos del perfil (nombre y email)
5. **Ordenamiento**: Los usuarios están ordenados por `rankingScore` de mayor a menor

### Casos de Uso

1. **Tabla de clasificación general**: Mostrar los top 50 usuarios en la pantalla principal
2. **Competencias**: Ver el ranking completo en eventos o desafíos
3. **Motivación**: Permitir a los usuarios ver su posición respecto a otros
4. **Gamificación**: Integrar con sistemas de recompensas y logros
