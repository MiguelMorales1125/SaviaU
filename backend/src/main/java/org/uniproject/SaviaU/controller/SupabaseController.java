package org.uniproject.SaviaU.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.service.auth.AuthService;
import org.uniproject.SaviaU.service.auth.PasswordService;
import org.uniproject.SaviaU.service.profile.OnboardingService;
import org.uniproject.SaviaU.service.diagnostic.DiagnosticService;
import org.uniproject.SaviaU.service.health.HealthService;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupabaseController {

    private final AuthService authService;
    private final PasswordService passwordService;
    private final OnboardingService onboardingService;
    private final DiagnosticService diagnosticService;
    private final HealthService healthService;

    /**
     * Endpoint para verificar la conectividad con Supabase
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> healthCheck() {
        return healthService.healthCheck()
                .map(isHealthy -> {
                    if (isHealthy) {
                        return ResponseEntity.ok(Map.of(
                                "status", "UP",
                                "database", "Supabase",
                                "message", "Conexión exitosa"
                        ));
                    } else {
                        return ResponseEntity.status(503).body(Map.of(
                                "status", "DOWN",
                                "database", "Supabase",
                                "message", "Error de conexión"
                        ));
                    }
                });
    }

    /**
     * Endpoint para autenticación/inicio de sesión
     * POST /api/auth/login
     */
    @PostMapping("/auth/login")
    public Mono<ResponseEntity<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(401).build());
    }

    /**
     * Endpoint para registro
     * POST /api/auth/register
     */
    @PostMapping("/auth/register")
    public Mono<ResponseEntity<LoginResponse>> register(@RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }


    /**
     * Obtener URL de autorización de Google (Supabase Auth)
     */
    @GetMapping("/auth/google/url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl(@RequestParam(required = false) String redirectTo) {
        String url = authService.buildGoogleAuthUrl(redirectTo);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Finalizar login con Google: recibe accessToken/refreshToken del fragmento
     */
    @PostMapping("/auth/google/finish")
    public Mono<ResponseEntity<LoginResponse>> finishGoogle(@RequestBody GoogleFinishRequest request) {
        return authService.finishGoogleLogin(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    @PostMapping("/auth/password/reset")
    public Mono<ResponseEntity<Map<String, String>>> sendPasswordReset(@RequestBody PasswordResetRequest request) {
        return passwordService.sendPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo enviar el correo")));
    }

    /**
     * Aplicar nueva contraseña con el token del enlace
     */
    @PostMapping("/auth/password/apply")
    public Mono<ResponseEntity<Map<String, String>>> applyPassword(@RequestBody PasswordApplyRequest request) {
        return passwordService.applyPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar la contraseña")));
    }

    /**
     * Completar/actualizar el perfil después de login (Google o email)
     */
    @PostMapping("/auth/onboard")
    public Mono<ResponseEntity<Map<String, String>>> onboard(@RequestBody OnboardRequest request) {
        return onboardingService.onboard(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar el perfil")));
    }

    /**
     * Preguntas del diagnóstico (múltiple opción, sin marcar correctas)
     */
    @GetMapping("/diagnostic/questions")
    public Mono<ResponseEntity<List<DiagnosticQuestionDto>>> getDiagnosticQuestions() {
        return diagnosticService.getQuestions()
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    /**
     * Estado del diagnóstico del usuario (require accessToken de Supabase)
     */
    @GetMapping("/diagnostic/status")
    public Mono<ResponseEntity<Map<String, Object>>> diagnosticStatus(@RequestParam String accessToken) {
        return diagnosticService.getStatus(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo obtener el estado")));
    }

    /**
     * Enviar respuestas del diagnóstico y obtener resumen
     */
    @PostMapping("/diagnostic/submit")
    public Mono<ResponseEntity<DiagnosticResultDto>> submitDiagnostic(@RequestBody DiagnosticSubmitRequest request) {
        return diagnosticService.submit(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    /**
     * Último resultado del diagnóstico del usuario
     */
    @GetMapping("/diagnostic/result")
    public Mono<ResponseEntity<DiagnosticResultDto>> getLastResult(@RequestParam String accessToken) {
        return diagnosticService.getLastResult(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(404).build());
    }
}