package org.uniproject.SaviaU.service.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.security.util.JwtUtil;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseClients clients;

    public Mono<LoginResponse> login(LoginRequest loginRequest) {
        Map<String, String> authData = Map.of(
                "email", loginRequest.getEmail(),
                "password", loginRequest.getPassword()
        );

        return clients.getAuthPublic().post()
                .uri("/token?grant_type=password")
                .bodyValue(authData)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::mapAuthResponseToLoginResponse)
                .flatMap(lr -> {
                    String uid = lr.getUser() != null ? lr.getUser().getId() : null;
                    String email = lr.getUser() != null ? lr.getUser().getEmail() : loginRequest.getEmail();
                    lr.setAppToken(generateAppToken(uid, email));

                    // Consultar si el usuario es administrador y activo en admin_users
                    Mono<List<Map<String, Object>>> adminRowsMono = clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/admin_users")
                                    .queryParam("select", "id,email,is_active")
                                    .queryParam("email", "eq." + email)
                                    .build())
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

                    return adminRowsMono
                            .map(rows -> {
                                try {
                                    if (rows != null && !rows.isEmpty()) {
                                        Map<String, Object> row = rows.get(0);
                                        boolean isActive = row.get("is_active") == null ? true : Boolean.valueOf(String.valueOf(row.get("is_active")));
                                        if (isActive) {
                                            String subject = (uid != null && !uid.isBlank()) ? uid : email;
                                            String adminToken = JwtUtil.generateHs256Token(
                                                    subject,
                                                    email,
                                                    "admin",
                                                    "savia-u-admin",
                                                    7200,
                                                    clients.getProps().getJwtSecret()
                                            );
                                            lr.setAdminToken(adminToken);
                                            if (lr.getUser() != null) {
                                                lr.getUser().setDiagnosticCompleted(Boolean.TRUE);
                                            }
                                        }
                                    }
                                } catch (Exception ignored) {}
                                return lr;
                            })
                            .onErrorResume(ex -> {
                                // Si falla la consulta admin, devolvemos login normal sin adminToken
                                return Mono.just(lr);
                            });
                })
                .doOnSuccess(r -> log.info("Usuario autenticado: {}", loginRequest.getEmail()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Login error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Credenciales inválidas o error de autenticación"));
                });
    }

    public Mono<LoginResponse> register(RegisterRequest request) {
        Map<String, Object> createUserBody = Map.of(
                "email", request.getEmail(),
                "password", request.getPassword(),
                "email_confirm", true,
                "user_metadata", Map.of(
                        "full_name", request.getFullName(),
                        "carrera", request.getCarrera(),
                        "universidad", request.getUniversidad(),
                        "semestre", request.getSemestre()
                )
        );

        return clients.getAuthAdmin().post()
                .uri("/admin/users")
                .bodyValue(createUserBody)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    String userId = (String) userResp.get("id");
                    if (userId == null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> userObj = (Map<String, Object>) userResp.get("user");
                        if (userObj != null) userId = (String) userObj.get("id");
                    }
                    if (userId == null) return Mono.error(new RuntimeException("No se pudo obtener el ID del usuario de Supabase"));

                    Map<String, Object> profile = Map.of(
                            "id", userId,
                            "full_name", request.getFullName(),
                            "email", request.getEmail(),
                            "carrera", request.getCarrera(),
                            "universidad", request.getUniversidad(),
                            "semestre", request.getSemestre()
                    );

                    return clients.getDbAdmin().post()
                            .uri("/usuarios")
                            .header("Prefer", "return=representation")
                            .bodyValue(profile)
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just("{}"))
                            .thenReturn(userId);
                })
                .flatMap(userId -> {
                    Map<String, String> authData = Map.of(
                            "email", request.getEmail(),
                            "password", request.getPassword()
                    );
                    return clients.getAuthPublic().post()
                            .uri("/token?grant_type=password")
                            .bodyValue(authData)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .map(this::mapAuthResponseToLoginResponse)
                            .map(lr -> {
                                String appToken = generateAppToken(lr.getUser() != null ? lr.getUser().getId() : userId, request.getEmail());
                                lr.setAppToken(appToken);
                                return lr;
                            });
                })
                .doOnSuccess(r -> log.info("Usuario registrado: {}", request.getEmail()))
                .onErrorResume(WebClientResponseException.class, ex -> Mono.error(new RuntimeException("No se pudo registrar el usuario: " + safeMsg(ex))));
    }

    public String buildGoogleAuthUrl(String redirectTo) {
        String base = clients.getProps().getUrl() + "/auth/v1/authorize?provider=google";
        if (redirectTo != null && !redirectTo.isBlank()) {
            base += "&redirect_to=" + URLEncoder.encode(redirectTo, StandardCharsets.UTF_8);
        }
        return base;
    }

    public Mono<LoginResponse> finishGoogleLogin(GoogleFinishRequest request) {
        WebClient userClient = WebClient.builder()
                .baseUrl(clients.getProps().getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", clients.getProps().getAnonKey())
                .defaultHeader("Authorization", "Bearer " + request.getAccessToken())
                .build();

    return userClient.get()
        .uri("/user")
        .retrieve()
        .bodyToMono(Map.class)
        .flatMap(userResp -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> user = (Map<String, Object>) userResp;
                    String id = (String) user.get("id");
                    String email = (String) user.get("email");
                    String role = (String) user.get("role");
                    String createdAt = (String) user.get("created_at");
                    String lastSignIn = (String) user.get("last_sign_in_at");

                    LoginResponse.UserInfo ui = LoginResponse.UserInfo.builder()
                            .id(id).email(email).role(role)
                            .createdAt(createdAt).lastSignInAt(lastSignIn)
                            .build();

                    LoginResponse lr = LoginResponse.builder()
                            .accessToken(request.getAccessToken())
                            .refreshToken(request.getRefreshToken())
                            .tokenType("bearer")
                            .expiresIn(null)
                            .user(ui)
                            .build();
                    lr.setAppToken(generateAppToken(id, email));
                    // Consultar admin_users para marcar adminToken y diagnosticCompleted si aplica
                    Mono<List<Map<String, Object>>> adminRowsMono = clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/admin_users")
                                    .queryParam("select", "id,email,is_active")
                                    .queryParam("email", "eq." + email)
                                    .build())
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

                    return adminRowsMono.map(rows -> {
                        try {
                            if (rows != null && !rows.isEmpty()) {
                                Map<String, Object> row = rows.get(0);
                                boolean isActive = row.get("is_active") == null ? true : Boolean.valueOf(String.valueOf(row.get("is_active")));
                                if (isActive) {
                                    String subject = (id != null && !id.isBlank()) ? id : email;
                                    String adminToken = JwtUtil.generateHs256Token(
                                            subject,
                                            email,
                                            "admin",
                                            "savia-u-admin",
                                            7200,
                                            clients.getProps().getJwtSecret()
                                    );
                                    lr.setAdminToken(adminToken);
                                    if (lr.getUser() != null) {
                                        lr.getUser().setDiagnosticCompleted(Boolean.TRUE);
                                    }
                                }
                            }
                        } catch (Exception ignored) {}
                        return lr;
                    }).onErrorResume(e -> Mono.just(lr));
                })
                .doOnError(e -> log.error("Error al finalizar login con Google: {}", e.getMessage()));
    }

    public Mono<LoginResponse> refreshSession(TokenRefreshRequest request) {
        if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            return Mono.error(new RuntimeException("Refresh token requerido"));
        }

        Map<String, String> body = Map.of("refresh_token", request.getRefreshToken());

        return clients.getAuthPublic().post()
                .uri("/token?grant_type=refresh_token")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(this::mapAuthResponseToLoginResponse)
                .map(lr -> {
                    String uid = lr.getUser() != null ? lr.getUser().getId() : null;
                    String email = lr.getUser() != null ? lr.getUser().getEmail() : null;
                    lr.setAppToken(generateAppToken(uid, email));
                    return lr;
                })
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Refresh session failed {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo refrescar la sesión"));
                });
    }

    private String generateAppToken(String userId, String email) {
        String subject = (userId != null && !userId.isBlank()) ? userId : email;
        return JwtUtil.generateHs256Token(
                subject,
                email,
                "authenticated",
                "savia-u",
                3600,
                clients.getProps().getJwtSecret()
        );
    }

    private LoginResponse mapAuthResponseToLoginResponse(Map<?, ?> response) {
        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) response.get("user");
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(user != null ? (String) user.get("id") : null)
                .email(user != null ? (String) user.get("email") : null)
                .role(user != null ? (String) user.get("role") : null)
                .createdAt(user != null ? (String) user.get("created_at") : null)
                .lastSignInAt(user != null ? (String) user.get("last_sign_in_at") : null)
                .build();
        return LoginResponse.builder()
                .accessToken((String) response.get("access_token"))
                .refreshToken((String) response.get("refresh_token"))
                .tokenType((String) response.get("token_type"))
                .expiresIn(response.get("expires_in") != null ? ((Number) response.get("expires_in")).longValue() : null)
                .user(userInfo)
                .build();
    }

    private String safeMsg(WebClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        return body != null && !body.isBlank() ? body : ex.getMessage();
    }
}

