package org.uniproject.SaviaU.service.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.AdminLoginRequest;
import org.uniproject.SaviaU.dto.AdminLoginResponse;
import org.uniproject.SaviaU.dto.AdminPasswordResetRequest;
import org.uniproject.SaviaU.dto.PasswordApplyRequest;
import org.uniproject.SaviaU.security.util.JwtUtil;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final SupabaseClients clients;

    public Mono<AdminLoginResponse> login(AdminLoginRequest request) {
        // 1) Validar credenciales con Supabase Auth (password grant)
        Map<String, String> authData = Map.of(
                "email", request.getEmail(),
                "password", request.getPassword()
        );
        Mono<Map<String, Object>> tokenMono = clients.getAuthPublic().post()
                .uri("/token?grant_type=password")
                .bodyValue(authData)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("Admin login credenciales inválidas para {}: {}", request.getEmail(), ex.getStatusCode());
                    return Mono.error(new RuntimeException("Credenciales inválidas"));
                });

        // 2) Autorización: verificar que el email esté en admin_users y activo
        Mono<List<Map<String, Object>>> adminRowsMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/admin_users")
                        .queryParam("select", "id,email,full_name,is_active")
                        .queryParam("email", "eq." + request.getEmail())
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

        return Mono.zip(tokenMono, adminRowsMono).flatMap(tuple -> {
            List<Map<String, Object>> rows = tuple.getT2();
            if (rows.isEmpty()) {
                return Mono.error(new RuntimeException("No autorizado"));
            }
            Map<String, Object> row = rows.get(0);
            Boolean isActive = row.get("is_active") == null ? Boolean.TRUE : Boolean.valueOf(String.valueOf(row.get("is_active")));
            if (!isActive) return Mono.error(new RuntimeException("Cuenta deshabilitada"));

            String adminId = (String) row.get("id");
            String email = (String) row.get("email");
            String fullName = row.get("full_name") == null ? null : String.valueOf(row.get("full_name"));

            // 3) Actualizar last_login_at encadenado
            Mono<Void> updateLastLogin = clients.getDbAdmin().patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/admin_users")
                            .queryParam("id", "eq." + adminId)
                            .build())
                    .header("Prefer", "return=minimal")
                    .bodyValue(Map.of("last_login_at", Instant.now().toString()))
                    .retrieve()
                    .toBodilessEntity()
                    .then();

            // 4) Generar adminToken con rol=admin
            String adminToken = JwtUtil.generateHs256Token(
                    adminId != null ? adminId : email,
                    email,
                    "admin",
                    "savia-u-admin",
                    7200,
                    clients.getProps().getJwtSecret()
            );
            AdminLoginResponse response = AdminLoginResponse.builder()
                    .adminToken(adminToken)
                    .id(adminId)
                    .email(email)
                    .fullName(fullName)
                    .build();

            return updateLastLogin.thenReturn(response);
        });
    }

    public Mono<String> sendPasswordReset(AdminPasswordResetRequest request) {
        // Por privacidad, siempre responder 200 aunque email no esté en admin_users
        return clients.getAuthPublic().post()
                .uri("/recover")
                .bodyValue(Map.of("email", request.getEmail()))
                .retrieve()
                .toBodilessEntity()
                .map(resp -> "Si el correo existe, se envió un enlace de recuperación")
                .onErrorResume(WebClientResponseException.class, ex -> Mono.just("Si el correo existe, se envió un enlace de recuperación"));
    }

    public Mono<String> applyPassword(PasswordApplyRequest request) {
        // Usar access_token del enlace de Supabase para actualizar password
        WebClient tokenClient = WebClient.builder()
                .baseUrl(clients.getProps().getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", clients.getProps().getAnonKey())
                .defaultHeader("Authorization", "Bearer " + request.getAccessToken())
                .build();

        return tokenClient.put()
                .uri("/user")
                .bodyValue(Map.of("password", request.getNewPassword()))
                .retrieve()
                .bodyToMono(String.class)
                .map(s -> "Contraseña actualizada")
                .onErrorResume(WebClientResponseException.class, ex -> Mono.error(new RuntimeException("No se pudo actualizar la contraseña")));
    }

    public Mono<String> logout() {
        // Stateless: el cliente debe descartar el adminToken. Aquí solo devolvemos OK.
        return Mono.just("OK");
    }
}
