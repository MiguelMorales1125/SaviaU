package org.uniproject.SaviaU.service.profile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.OnboardRequest;
import reactor.core.publisher.Mono;

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
}

