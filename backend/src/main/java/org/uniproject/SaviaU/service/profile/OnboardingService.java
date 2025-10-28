package org.uniproject.SaviaU.service.profile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.OnboardRequest;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
}
