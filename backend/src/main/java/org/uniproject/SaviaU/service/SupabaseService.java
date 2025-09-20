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
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class SupabaseService {

    private final SupabaseProperties supabaseProperties;
    private final WebClient webClient;
    private final WebClient authClient;

    /**
     * Constructor que configura el WebClient con la URL base de Supabase
     */
    public SupabaseService(SupabaseProperties supabaseProperties) {
        this.supabaseProperties = supabaseProperties;
        
        // Cliente para la API REST
        this.webClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/rest/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + supabaseProperties.getAnonKey())
                .build();
                
        // Cliente para la API Auth
        this.authClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
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
     * Autenticar usuario con email y contraseña
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
                .map(response -> {
                    // Mapear la respuesta de Supabase a nuestro DTO
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
                            .expiresIn(((Number) response.get("expires_in")).longValue())
                            .user(userInfo)
                            .build();
                })
                .doOnSuccess(result -> log.info("Usuario autenticado exitosamente: {}", loginRequest.getEmail()))
                .doOnError(error -> log.error("Error al autenticar usuario {}: {}", loginRequest.getEmail(), error.getMessage()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Error HTTP en login {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("Credenciales inválidas o error de autenticación"));
                });
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