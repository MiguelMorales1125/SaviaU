package org.uniproject.SaviaU.service.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.PasswordApplyRequest;
import org.uniproject.SaviaU.dto.PasswordResetRequest;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private final SupabaseClients clients;

    public Mono<String> sendPasswordReset(PasswordResetRequest request) {
        Map<String, Object> body = (request.getRedirectUri() != null && !request.getRedirectUri().isBlank())
                ? Map.of("email", request.getEmail(), "redirect_to", request.getRedirectUri())
                : Map.of("email", request.getEmail());

        return clients.getAuthPublic().post()
                .uri("/recover")
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .map(resp -> "Correo de recuperación enviado si el email existe")
                .doOnError(e -> log.error("Error al solicitar recuperación: {}", e.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> Mono.error(new RuntimeException("No se pudo enviar el correo de recuperación")));
    }

    public Mono<String> applyPasswordReset(PasswordApplyRequest request) {
        return clients.buildUserAuthClient(request.getAccessToken())
                .put()
                .uri("/user")
                .bodyValue(Map.of("password", request.getNewPassword()))
                .retrieve()
                .bodyToMono(String.class)
                .map(s -> "Contraseña actualizada")
                .doOnError(e -> log.error("Error al aplicar nueva contraseña: {}", e.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> Mono.error(new RuntimeException("No se pudo actualizar la contraseña")));
    }
}

