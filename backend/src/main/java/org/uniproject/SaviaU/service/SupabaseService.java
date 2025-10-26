package org.uniproject.SaviaU.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseProperties;
import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.security.util.JwtUtil;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Service
public class SupabaseService {

    private final SupabaseProperties supabaseProperties;
    private final WebClient webClient;       // DB con anon
    private final WebClient authClient;      // Auth público
    private final WebClient adminDbClient;   // DB con service role
    private final WebClient adminAuthClient; // Auth admin

    /**
     * Constructor que configura los WebClient con la URL base de Supabase
     */
    public SupabaseService(SupabaseProperties supabaseProperties) {
        this.supabaseProperties = supabaseProperties;
        
        // Cliente para la API REST (RLS con anon key)
        this.webClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/rest/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + supabaseProperties.getAnonKey())
                .build();
                
        // Cliente para la API Auth pública
        this.authClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .build();

        // Cliente DB con service role (omite RLS)
        this.adminDbClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/rest/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + supabaseProperties.getServiceRoleKey())
                .build();

        // Cliente Auth admin
        this.adminAuthClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + supabaseProperties.getServiceRoleKey())
                .build();
    }

    /**
     * Autenticar usuario with email y contraseña
     */
    public Mono<LoginResponse> login(LoginRequest loginRequest) {
        Map<String, String> authData = Map.of(
                "email", loginRequest.getEmail(),
                "password", loginRequest.getPassword()
        );

        return authClient.post()
                .uri("/token?grant_type=password")
                .bodyValue(authData)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> mapAuthResponseToLoginResponse(response))
                .map(lr -> {
                    String uid = lr.getUser() != null ? lr.getUser().getId() : null;
                    String email = lr.getUser() != null ? lr.getUser().getEmail() : loginRequest.getEmail();
                    lr.setAppToken(generateAppToken(uid, email));
                    return lr;
                })
                .doOnSuccess(result -> log.info("Usuario autenticado exitosamente: {}", loginRequest.getEmail()))
                .doOnError(error -> log.error("Error al autenticar usuario {}: {}", loginRequest.getEmail(), error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP en login {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Credenciales inválidas o error de autenticación"));
                });
    }

    /**
     * Registrar usuario: crea el usuario en Auth (admin), guarda su perfil en 'usuarios',
     * y devuelve tokens de sesión + un JWT propio (appToken).
     */
    public Mono<LoginResponse> register(RegisterRequest request) {
        // 1) Crear usuario vía Auth Admin (requiere service role). Aquí confirmamos email para inicio inmediato
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

        return adminAuthClient.post()
                .uri("/admin/users")
                .bodyValue(createUserBody)
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    // 2) Extraer ID del usuario creado
                    String userId = (String) userResp.get("id");
                    if (userId == null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> userObj = (Map<String, Object>) userResp.get("user");
                        if (userObj != null) {
                            userId = (String) userObj.get("id");
                        }
                    }
                    if (userId == null) {
                        return Mono.error(new RuntimeException("No se pudo obtener el ID del usuario de Supabase"));
                    }

                    // 3) Insertar perfil en tabla 'usuarios' con service role
                    Map<String, Object> profile = Map.of(
                            "id", userId,
                            "full_name", request.getFullName(),
                            "email", request.getEmail(),
                            "carrera", request.getCarrera(),
                            "universidad", request.getUniversidad(),
                            "semestre", request.getSemestre()
                    );

                    return adminDbClient.post()
                            .uri("/usuarios")
                            .header("Prefer", "return=representation")
                            .bodyValue(profile) // enviar el objeto directamente
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> {
                                log.error("Error insertando perfil en 'usuarios': {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                                // No romper el registro por fallo en perfil: continuar pero loggear
                                return Mono.just("{}");
                            })
                            .thenReturn(userId);
                })
                .flatMap(userId -> {
                    // 4) Autologin para obtener access_token/refresh_token
                    Map<String, String> authData = Map.of(
                            "email", request.getEmail(),
                            "password", request.getPassword()
                    );

                    return authClient.post()
                            .uri("/token?grant_type=password")
                            .bodyValue(authData)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .map(this::mapAuthResponseToLoginResponse)
                            .map(lr -> {
                                // 5) Generar JWT propio appToken
                                String appToken = generateAppToken(lr.getUser() != null ? lr.getUser().getId() : userId, request.getEmail());
                                lr.setAppToken(appToken);
                                return lr;
                            });
                })
                .doOnSuccess(r -> log.info("Usuario registrado y autenticado: {}", request.getEmail()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP en register {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo registrar el usuario: " + safeMsg(ex)));
                });
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

    private String generateAppToken(String userId, String email) {
        String subject = (userId != null && !userId.isBlank()) ? userId : email;
        return JwtUtil.generateHs256Token(
                subject,
                email,
                "authenticated",
                "savia-u",
                3600,
                supabaseProperties.getJwtSecret()
        );
    }

    private String safeMsg(WebClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        return body != null && !body.isBlank() ? body : ex.getMessage();
    }

    /**
     * Verificar la conectividad con Supabase
     */
    public Mono<Boolean> healthCheck() {
        return webClient.get()
                .uri("/")
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode() == HttpStatus.OK)
                .doOnNext(isHealthy -> log.info("Supabase health check: {}", isHealthy ? "OK" : "FAILED"))
                .onErrorReturn(false);
    }

    /**
     * Construye la URL de autorización para Google OAuth (Supabase Auth)
     */
    public String buildGoogleAuthUrl(String redirectTo) {
        String base = supabaseProperties.getUrl() + "/auth/v1/authorize?provider=google";
        if (redirectTo != null && !redirectTo.isBlank()) {
            base += "&redirect_to=" + URLEncoder.encode(redirectTo, StandardCharsets.UTF_8);
        }
        // Puedes añadir scopes si tu proyecto de Google los requiere, por ejemplo: &scopes=openid%20email%20profile
        return base;
    }

    /**
     * Finaliza el login con Google a partir del accessToken devuelto en el fragmento (#)
     */
    public Mono<LoginResponse> finishGoogleLogin(GoogleFinishRequest request) {
        WebClient userClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + request.getAccessToken())
                .build();

        return userClient.get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .map(userResp -> {
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
                    return lr;
                })
                .doOnError(e -> log.error("Error al finalizar login con Google: {}", e.getMessage()));
    }

    /**
     * Solicitar email de recuperación de contraseña
     */
    public Mono<String> sendPasswordReset(PasswordResetRequest request) {
        Map<String, Object> body = request.getRedirectUri() != null && !request.getRedirectUri().isBlank()
                ? Map.of("email", request.getEmail(), "redirect_to", request.getRedirectUri())
                : Map.of("email", request.getEmail());

        return authClient.post()
                .uri("/recover")
                .bodyValue(body)
                .retrieve()
                .toBodilessEntity()
                .map(resp -> "Correo de recuperación enviado si el email existe")
                .doOnError(e -> log.error("Error al solicitar recuperación: {}", e.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP en recover {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo enviar el correo de recuperación"));
                });
    }

    /**
     * Aplicar nuevo password usando el access_token del enlace
     */
    public Mono<String> applyPasswordReset(PasswordApplyRequest request) {
        WebClient tokenClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + request.getAccessToken())
                .build();

        return tokenClient.put() // GoTrue soporta update con PUT o PATCH en /user
                .uri("/user")
                .bodyValue(Map.of("password", request.getNewPassword()))
                .retrieve()
                .bodyToMono(String.class)
                .map(s -> "Contraseña actualizada")
                .doOnError(e -> log.error("Error al aplicar nueva contraseña: {}", e.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP en apply password {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo actualizar la contraseña"));
                });
    }

    /**
     * Completar/actualizar el perfil del usuario tras login (Google o email)
     */
    public Mono<String> onboard(OnboardRequest request) {
        // 1) Validar access_token consultando /auth/v1/user
        WebClient userClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
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
                    if (id == null || email == null) {
                        return Mono.error(new RuntimeException("Token inválido: sin id/email"));
                    }
                    // 2) Upsert del perfil en 'usuarios' con service role
                    Map<String, Object> profile = Map.of(
                            "id", id,
                            "full_name", request.getFullName(),
                            "email", email,
                            "carrera", request.getCarrera(),
                            "universidad", request.getUniversidad(),
                            "semestre", request.getSemestre()
                    );

                    return adminDbClient.post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("on_conflict", "id")
                                    .build())
                            .header("Prefer", "resolution=merge-duplicates,return=representation")
                            .bodyValue(profile)
                            .retrieve()
                            .bodyToMono(String.class)
                            .map(resp -> "Perfil actualizado")
                            .onErrorResume(WebClientResponseException.class, ex -> {
                                log.error("Error en onboard perfil: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                                return Mono.error(new RuntimeException("No se pudo actualizar el perfil"));
                            });
                });
    }
}
