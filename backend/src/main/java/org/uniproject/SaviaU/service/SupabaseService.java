package org.uniproject.SaviaU.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseProperties;
import org.uniproject.SaviaU.dto.LoginRequest;
import org.uniproject.SaviaU.dto.LoginResponse;
import org.uniproject.SaviaU.dto.RegisterRequest;
import org.uniproject.SaviaU.util.JwtUtil;
import reactor.core.publisher.Mono;

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
     * Realizar una consulta SELECT a una tabla
     */
    public Mono<String> select(String table, String columns, String filter) {
        return webClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/" + table);
                    if (columns != null && !columns.isEmpty()) {
                        builder.queryParam("select", columns);
                    }
                    if (filter != null && !filter.isEmpty()) {
                        builder.queryParam("filter", filter);
                    }
                    return builder.build();
                })
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> log.error("Error al realizar SELECT en tabla {}: {}", table, error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Error al consultar Supabase: " + ex.getMessage()));
                });
    }

    /**
     * Realizar una inserción INSERT en una tabla
     */
    public Mono<String> insert(String table, Object data) {
        return webClient.post()
                .uri("/" + table)
                .bodyValue(data)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> log.error("Error al realizar INSERT en tabla {}: {}", table, error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Error al insertar en Supabase: " + ex.getMessage()));
                });
    }

    /**
     * Realizar una actualización UPDATE en una tabla
     */
    public Mono<String> update(String table, Object data, String filter) {
        return webClient.patch()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + table)
                        .queryParam("filter", filter)
                        .build())
                .bodyValue(data)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> log.error("Error al realizar UPDATE en tabla {}: {}", table, error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Error al actualizar en Supabase: " + ex.getMessage()));
                });
    }

    /**
     * Realizar una eliminación DELETE en una tabla
     */
    public Mono<String> delete(String table, String filter) {
        return webClient.delete()
                .uri(uriBuilder -> uriBuilder
                        .path("/" + table)
                        .queryParam("filter", filter)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> log.error("Error al realizar DELETE en tabla {}: {}", table, error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Error al eliminar en Supabase: " + ex.getMessage()));
                });
    }

    /**
     * Ejecutar una función de Supabase
     */
    public Mono<String> rpc(String functionName, Map<String, Object> parameters) {
        return webClient.post()
                .uri("/rpc/" + functionName)
                .bodyValue(parameters != null ? parameters : Map.of())
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(error -> log.error("Error al ejecutar función {}: {}", functionName, error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono
                            .error(new RuntimeException("Error al ejecutar función en Supabase: " + ex.getMessage()));
                });
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
}
