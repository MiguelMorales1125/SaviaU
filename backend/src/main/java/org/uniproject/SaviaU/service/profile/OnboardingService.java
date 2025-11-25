package org.uniproject.SaviaU.service.profile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.OnboardRequest;
import org.uniproject.SaviaU.dto.UserRankingDto;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final SupabaseClients clients;

    public Mono<String> onboard(OnboardRequest request) {
        return clients.buildUserAuthClient(request.getAccessToken())
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> user = (Map<String, Object>) userResp;
                    String id = (String) user.get("id");
                    String email = (String) user.get("email");
                    if (id == null || email == null) {
                        return Mono.error(new RuntimeException("Token inválido: sin id/email"));
                    }
                    Map<String, Object> profile = Map.of(
                            "id", id,
                            "full_name", request.getFullName(),
                            "email", email,
                            "carrera", request.getCarrera(),
                            "universidad", request.getUniversidad(),
                            "semestre", request.getSemestre()
                    );

                    return clients.getDbAdmin().post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("on_conflict", "id")
                                    .build())
                            .header("Prefer", "resolution=merge-duplicates,return=representation")
                            .bodyValue(profile)
                            .retrieve()
                            .bodyToMono(String.class)
                            .map(resp -> "Perfil actualizado")
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.error(new RuntimeException("No se pudo actualizar el perfil")));
                });
    }

    public Mono<Map<String, Object>> profileStatus(String accessToken) {
        return clients.buildUserAuthClient(accessToken)
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> user = (Map<String, Object>) userResp;
                    String id = (String) user.get("id");
                    String email = (String) user.get("email");
                    if (id == null) return Mono.error(new RuntimeException("Token inválido"));

                    return clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("select", "id,full_name,carrera,universidad,semestre")
                                    .queryParam("id", "eq." + id)
                                    .build())
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .collectList()
                            .map(list -> {
                                if (list.isEmpty()) {
                                    return Map.of(
                                            "userId", id,
                                            "email", email,
                                            "exists", false,
                                            "complete", false,
                                            "isNewUser", true,
                                            "missingFields", List.of("full_name", "carrera", "universidad", "semestre")
                                    );
                                }
                                Map row = list.get(0);
                                List<String> missing = new java.util.ArrayList<>();
                                Object fn = row.get("full_name");
                                Object ca = row.get("carrera");
                                Object un = row.get("universidad");
                                Object se = row.get("semestre");
                                if (fn == null || String.valueOf(fn).isBlank()) missing.add("full_name");
                                if (ca == null || String.valueOf(ca).isBlank()) missing.add("carrera");
                                if (un == null || String.valueOf(un).isBlank()) missing.add("universidad");
                                if (se == null) missing.add("semestre");
                                boolean complete = missing.isEmpty();
                                Map<String, Object> out = new HashMap<>();
                                out.put("userId", id);
                                out.put("email", email);
                                out.put("exists", true);
                                out.put("complete", complete);
                                out.put("isNewUser", false);
                                out.put("missingFields", missing);
                                return out;
                            });
                });
    }

    // Nuevo: obtener el perfil guardado del usuario
    public Mono<Map<String, Object>> getProfile(String accessToken) {
        return clients.buildUserAuthClient(accessToken)
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> user = (Map<String, Object>) userResp;
                    String id = (String) user.get("id");
                    String email = (String) user.get("email");
                    if (id == null) return Mono.error(new RuntimeException("Token inválido"));

                    return clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("select", "id,full_name,carrera,universidad,semestre,alias,intereses,photo_url,avatar_key,updated_at")
                                    .queryParam("id", "eq." + id)
                                    .build())
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .collectList()
                            .map(list -> {
                                Map<String, Object> base = new HashMap<>();
                                base.put("userId", id);
                                base.put("email", email);
                                if (list.isEmpty()) {
                                    base.put("exists", false);
                                    base.put("profile", null);
                                    return base;
                                }
                                Map row = list.get(0);
                                Map<String, Object> profile = new HashMap<>();
                                profile.put("fullName", row.get("full_name"));
                                profile.put("carrera", row.get("carrera"));
                                profile.put("universidad", row.get("universidad"));
                                profile.put("semestre", row.get("semestre"));
                                profile.put("alias", row.get("alias"));
                                profile.put("intereses", row.get("intereses"));
                                profile.put("photoUrl", row.get("photo_url"));
                                profile.put("avatarKey", row.get("avatar_key"));
                                profile.put("updatedAt", row.get("updated_at"));
                                base.put("exists", true);
                                base.put("profile", profile);
                                return base;
                            });
                });
    }

    /**
     * Obtiene el ranking general de usuarios balanceado por cantidad de quizzes y promedio de puntaje.
     * La fórmula de ranking combina:
     * - 40% del promedio de puntaje (avg_score)
     * - 30% del mejor puntaje (best_score)
     * - 30% basado en la cantidad de quizzes completados (normalizado)
     */
    public Mono<List<UserRankingDto>> getUserRanking(String accessToken, int limit) {
        int fetchLimit = Math.min(2000, Math.max(limit * 5, 500));
        
        // Primero validamos el token
        return clients.buildUserAuthClient(accessToken)
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(user -> {
                    // Obtenemos todos los intentos de trivia
                    return clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/trivia_attempts")
                                    .queryParam("select", "id,user_id,score_percent,completed_at")
                                    .queryParam("order", "completed_at.desc")
                                    .queryParam("limit", fetchLimit)
                                    .build())
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                            .flatMap(rows -> {
                                // Agrupamos por usuario y calculamos estadísticas
                                Map<String, List<Map<String, Object>>> grouped = rows.stream()
                                        .filter(row -> row.get("user_id") != null)
                                        .collect(Collectors.groupingBy(row -> (String) row.get("user_id")));

                                // Calculamos el máximo de quizzes para normalizar
                                int maxQuizzes = grouped.values().stream()
                                        .mapToInt(List::size)
                                        .max()
                                        .orElse(1);

                                // Creamos las estadísticas por usuario
                                List<Map<String, Object>> stats = grouped.entrySet().stream()
                                        .map(entry -> {
                                            List<Map<String, Object>> attempts = entry.getValue();
                                            
                                            double avg = attempts.stream()
                                                    .mapToDouble(a -> toDouble(a.get("score_percent")))
                                                    .average()
                                                    .orElse(0);
                                            
                                            double best = attempts.stream()
                                                    .mapToDouble(a -> toDouble(a.get("score_percent")))
                                                    .max()
                                                    .orElse(0);
                                            
                                            int totalQuizzes = attempts.size();
                                            
                                            // Fórmula de ranking balanceada:
                                            // 40% promedio + 30% mejor puntaje + 30% cantidad normalizada
                                            double normalizedCount = (double) totalQuizzes / maxQuizzes * 100;
                                            double rankingScore = (avg * 0.4) + (best * 0.3) + (normalizedCount * 0.3);
                                            
                                            Map<String, Object> stat = new HashMap<>();
                                            stat.put("user_id", entry.getKey());
                                            stat.put("avg_score", avg);
                                            stat.put("best_score", best);
                                            stat.put("total_quizzes", totalQuizzes);
                                            stat.put("ranking_score", rankingScore);
                                            return stat;
                                        })
                                        .sorted(Comparator
                                                .comparingDouble((Map<String, Object> m) -> (double) m.get("ranking_score"))
                                                .reversed())
                                        .limit(limit)
                                        .collect(Collectors.toList());

                                // Enriquecemos con información de perfil
                                return enrichWithProfiles(stats)
                                        .map(profileMap -> {
                                            List<UserRankingDto> ranking = new ArrayList<>();
                                            int rank = 1;
                                            for (Map<String, Object> stat : stats) {
                                                String userId = (String) stat.get("user_id");
                                                Map<String, Object> profile = profileMap.getOrDefault(userId, Collections.emptyMap());
                                                
                                                ranking.add(UserRankingDto.builder()
                                                        .rank(rank++)
                                                        .userId(userId)
                                                        .fullName((String) profile.get("full_name"))
                                                        .email((String) profile.get("email"))
                                                        .totalQuizzes(((Number) stat.get("total_quizzes")).intValue())
                                                        .averageScore((double) stat.get("avg_score"))
                                                        .bestScore((double) stat.get("best_score"))
                                                        .rankingScore((double) stat.get("ranking_score"))
                                                        .build());
                                            }
                                            return ranking;
                                        });
                            });
                });
    }

    private Mono<Map<String, Map<String, Object>>> enrichWithProfiles(List<Map<String, Object>> stats) {
        if (stats.isEmpty()) {
            return Mono.just(Collections.emptyMap());
        }
        
        List<String> userIds = stats.stream()
                .map(m -> (String) m.get("user_id"))
                .collect(Collectors.toList());
        
        String inUsers = "in.(" + String.join(",", userIds) + ")";
        
        return clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/usuarios")
                        .queryParam("select", "id,email,full_name")
                        .queryParam("id", inUsers)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList()
                .map(profiles -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Map<String, Object>> result = profiles.stream()
                            .collect(Collectors.toMap(
                                    p -> (String) p.get("id"),
                                    p -> (Map<String, Object>) p
                            ));
                    return result;
                });
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try {
            return Double.parseDouble(String.valueOf(val));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
