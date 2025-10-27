package org.uniproject.SaviaU.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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

/**
 * Servicio para interactuar con Supabase (API REST y Auth)
 */
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
     * Solo añade redirect_to si el cliente lo envía explícitamente.
     */
    public String buildGoogleAuthUrl(String redirectTo) {
        String base = supabaseProperties.getUrl() + "/auth/v1/authorize?provider=google";
        if (redirectTo != null && !redirectTo.isBlank()) {
            base += "&redirect_to=" + URLEncoder.encode(redirectTo, StandardCharsets.UTF_8);
        }
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
     * Solo incluye redirect_to si el cliente lo envía explícitamente.
     */
    public Mono<String> sendPasswordReset(PasswordResetRequest request) {
        Map<String, Object> body = (request.getRedirectUri() != null && !request.getRedirectUri().isBlank())
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

    // ===================== DIAGNÓSTICO =====================

    /**
     * Retorna las preguntas activas del diagnóstico con sus opciones (sin marcar correctas)
     */
    public Mono<List<DiagnosticQuestionDto>> getDiagnosticQuestions() {
        // 1) Obtener preguntas activas
        Mono<List<Map>> questionsMono = adminDbClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/diagnostic_questions")
                        .queryParam("select", "id,prompt,topic,difficulty,is_active")
                        .queryParam("is_active", "eq.true")
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        return questionsMono.flatMap(qList -> {
            if (qList.isEmpty()) return Mono.just(List.of());
            List<String> qIds = qList.stream().map(m -> (String) m.get("id")).collect(Collectors.toList());
            String inParam = "in.(" + String.join(",", qIds) + ")";
            // 2) Obtener opciones por question_id
            Mono<List<Map>> optionsMono = adminDbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_options")
                            .queryParam("select", "id,question_id,text")
                            .queryParam("question_id", inParam)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return optionsMono.map(optList -> {
                Map<String, List<Map>> byQ = optList.stream().collect(Collectors.groupingBy(m -> (String) m.get("question_id")));
                List<DiagnosticQuestionDto> dto = new ArrayList<>();
                for (Map q : qList) {
                    String qid = (String) q.get("id");
                    List<DiagnosticQuestionDto.Option> opts = byQ.getOrDefault(qid, List.of()).stream()
                            .map(o -> DiagnosticQuestionDto.Option.builder()
                                    .id((String) o.get("id"))
                                    .text((String) o.get("text"))
                                    .build())
                            .collect(Collectors.toList());
                    dto.add(DiagnosticQuestionDto.builder()
                            .id(qid)
                            .prompt((String) q.get("prompt"))
                            .topic((String) q.get("topic"))
                            .difficulty((String) q.get("difficulty"))
                            .options(opts)
                            .build());
                }
                return dto;
            });
        });
    }

    /**
     * Verificar si el usuario ya completó el diagnóstico (flag en usuarios o existencia de attempt)
     */
    public Mono<Map<String, Object>> diagnosticStatus(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            // Revisar flag en usuarios
            return adminDbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/usuarios")
                            .queryParam("select", "id,has_completed_diagnostic,diagnostic_level,diagnostic_completed_at")
                            .queryParam("id", "eq." + userId)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList()
                    .map(list -> list.isEmpty() ? Map.of("completed", false) : Map.of(
                            "completed", Boolean.TRUE.equals(list.get(0).get("has_completed_diagnostic")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(list.get(0).get("has_completed_diagnostic")))),
                            "level", list.get(0).get("diagnostic_level"),
                            "completedAt", list.get(0).get("diagnostic_completed_at")
                    ));
        });
    }

    /**
     * Enviar respuestas, calcular puntaje, guardar intento y respuestas, actualizar perfil y retornar resumen
     */
    public Mono<DiagnosticResultDto> submitDiagnostic(DiagnosticSubmitRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> {
            String userId = (String) user.get("id");
            if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
                return Mono.error(new RuntimeException("No hay respuestas"));
            }
            List<String> optionIds = request.getAnswers().stream().map(DiagnosticSubmitRequest.Answer::getOptionId).toList();
            String optIn = "in.(" + String.join(",", optionIds) + ")";

            // 1) Traer opciones seleccionadas con su question_id y si son correctas
            Mono<List<Map>> selectedOptsMono = adminDbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_options")
                            .queryParam("select", "id,question_id,is_correct")
                            .queryParam("id", optIn)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            // 2) Traer preguntas para obtener topics
            Set<String> qIds = new HashSet<>(request.getAnswers().stream().map(DiagnosticSubmitRequest.Answer::getQuestionId).toList());
            String qIn = "in.(" + String.join(",", qIds) + ")";
            Mono<List<Map>> questionsMono = adminDbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_questions")
                            .queryParam("select", "id,topic")
                            .queryParam("id", qIn)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return Mono.zip(selectedOptsMono, questionsMono).flatMap(tuple -> {
                List<Map> selected = tuple.getT1();
                Map<String, Map> optById = selected.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> m));
                Map<String, String> qTopic = tuple.getT2().stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));

                int total = request.getAnswers().size();
                int correct = 0;
                Map<String, Integer> topicCorrect = new HashMap<>();

                for (DiagnosticSubmitRequest.Answer ans : request.getAnswers()) {
                    Map o = optById.get(ans.getOptionId());
                    boolean isCorrect = o != null && Boolean.TRUE.equals(o.get("is_correct"));
                    if (isCorrect) {
                        correct++;
                        String topic = qTopic.get(ans.getQuestionId());
                        if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                    }
                }
                double score = total == 0 ? 0.0 : (correct * 100.0 / total);
                String level = score >= 80 ? "Advanced" : score >= 50 ? "Intermediate" : "Beginner";
                Instant now = Instant.now();

                // 3) Insertar intento
                Map<String, Object> attemptBody = Map.of(
                        "user_id", userId,
                        "started_at", now.toString(),
                        "completed_at", now.toString(),
                        "score_percent", score,
                        "level", level
                );

                Mono<Map> attemptInsert = adminDbClient.post()
                        .uri("/diagnostic_attempts")
                        .header("Prefer", "return=representation")
                        .bodyValue(attemptBody)
                        .retrieve()
                        .bodyToMono(List.class)
                        .map(list -> (Map) list.get(0));

                // Hacer efectivamente finales las variables usadas en la lambda siguiente
                final String userIdFinal = userId;
                final double scoreFinal = score;
                final String levelFinal = level;
                final Instant nowFinal = now;
                final int correctFinal = correct;
                final int totalFinal = total;
                final Map<String, Integer> topicCorrectFinal = topicCorrect;

                return attemptInsert.flatMap(attempt -> {
                    String attemptId = (String) attempt.get("id");
                    // 4) Insertar respuestas en bulk
                    List<Map<String, Object>> answersRows = new ArrayList<>();
                    for (DiagnosticSubmitRequest.Answer ans : request.getAnswers()) {
                        Map o = optById.get(ans.getOptionId());
                        boolean isCorrect = o != null && Boolean.TRUE.equals(o.get("is_correct"));
                        answersRows.add(Map.of(
                                "attempt_id", attemptId,
                                "question_id", ans.getQuestionId(),
                                "selected_option_id", ans.getOptionId(),
                                "is_correct", isCorrect
                        ));
                    }

                    Mono<String> insertAnswers = adminDbClient.post()
                            .uri("/diagnostic_answers")
                            .header("Prefer", "return=minimal")
                            .bodyValue(answersRows)
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    // 5) Actualizar perfil del usuario con flag y nivel
                    Mono<String> updateUser = adminDbClient.patch()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("id", "eq." + userIdFinal)
                                    .build())
                            .header("Prefer", "return=minimal")
                            .bodyValue(Map.of(
                                    "has_completed_diagnostic", true,
                                    "diagnostic_level", levelFinal,
                                    "diagnostic_completed_at", nowFinal.toString()
                            ))
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    return Mono.when(insertAnswers, updateUser).thenReturn(
                            DiagnosticResultDto.builder()
                                    .userId(userIdFinal)
                                    .scorePercent(scoreFinal)
                                    .level(levelFinal)
                                    .recommendedTopics(recommendTopics(topicCorrectFinal))
                                    .topicBreakdown(topicCorrectFinal)
                                    .totalCorrect(correctFinal)
                                    .totalQuestions(totalFinal)
                                    .completedAt(nowFinal)
                                    .build()
                    );
                });
            });
        });
    }

    private List<String> recommendTopics(Map<String, Integer> topicCorrect) {
        // Recomendamos temas con 0 aciertos primero (si existen), si no, los de menor acierto
        if (topicCorrect == null || topicCorrect.isEmpty()) return List.of();
        int min = topicCorrect.values().stream().min(Integer::compare).orElse(0);
        return topicCorrect.entrySet().stream()
                .filter(e -> e.getValue() == min)
                .map(Map.Entry::getKey)
                .limit(3)
                .collect(Collectors.toList());
    }

    /**
     * Obtener último resultado del diagnóstico del usuario
     */
    public Mono<DiagnosticResultDto> getLastDiagnosticResult(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<List<Map>> attemptMono = adminDbClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_attempts")
                            .queryParam("select", "id,user_id,completed_at,score_percent,level")
                            .queryParam("user_id", "eq." + userId)
                            .queryParam("order", "completed_at.desc")
                            .queryParam("limit", "1")
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return attemptMono.flatMap(list -> {
                if (list.isEmpty()) return Mono.error(new RuntimeException("Sin intentos"));
                Map attempt = list.get(0);
                String attemptId = (String) attempt.get("id");

                // Traer respuestas para breakdown por tema
                Mono<List<Map>> answersMono = adminDbClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/diagnostic_answers")
                                .queryParam("select", "question_id,is_correct")
                                .queryParam("attempt_id", "eq." + attemptId)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                return answersMono.flatMap(ansList -> {
                    Set<String> qIds = ansList.stream().map(m -> (String) m.get("question_id")).collect(Collectors.toSet());
                    if (qIds.isEmpty()) {
                        return Mono.just(DiagnosticResultDto.builder()
                                .userId(userId)
                                .scorePercent(((Number) attempt.get("score_percent")).doubleValue())
                                .level((String) attempt.get("level"))
                                .recommendedTopics(List.of())
                                .topicBreakdown(Map.of())
                                .totalCorrect(0)
                                .totalQuestions(0)
                                .completedAt(Instant.parse((String) attempt.get("completed_at")))
                                .build());
                    }
                    String qIn = "in.(" + String.join(",", qIds) + ")";
                    Mono<List<Map>> qMono = adminDbClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/diagnostic_questions")
                                    .queryParam("select", "id,topic")
                                    .queryParam("id", qIn)
                                    .build())
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .collectList();

                    return qMono.map(qList -> {
                        Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                        Map<String, Integer> topicCorrect = new HashMap<>();
                        int correct = 0;
                        for (Map a : ansList) {
                            boolean isC = Boolean.TRUE.equals(a.get("is_correct"));
                            if (isC) {
                                correct++;
                                String topic = qTopic.get((String) a.get("question_id"));
                                if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                            }
                        }
                        int total = ansList.size();
                        double score = ((Number) attempt.get("score_percent")).doubleValue();
                        return DiagnosticResultDto.builder()
                                .userId(userId)
                                .scorePercent(score)
                                .level((String) attempt.get("level"))
                                .recommendedTopics(recommendTopics(topicCorrect))
                                .topicBreakdown(topicCorrect)
                                .totalCorrect(correct)
                                .totalQuestions(total)
                                .completedAt(Instant.parse((String) attempt.get("completed_at")))
                                .build();
                    });
                });
            });
        });
    }

    private Mono<Map> getUserFromToken(String accessToken) {
        WebClient userClient = WebClient.builder()
                .baseUrl(supabaseProperties.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", supabaseProperties.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .build();
        return userClient.get().uri("/user").retrieve().bodyToMono(Map.class);
    }
}
