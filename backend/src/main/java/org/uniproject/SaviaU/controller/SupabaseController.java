package org.uniproject.SaviaU.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.LoginRequest;
import org.uniproject.SaviaU.dto.LoginResponse;
import org.uniproject.SaviaU.dto.RegisterRequest;
import org.uniproject.SaviaU.dto.GoogleFinishRequest;
import org.uniproject.SaviaU.dto.PasswordResetRequest;
import org.uniproject.SaviaU.dto.PasswordApplyRequest;
import org.uniproject.SaviaU.dto.OnboardRequest;
import org.uniproject.SaviaU.service.SupabaseService;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Para permitir peticiones desde el frontend
public class SupabaseController {

    private final SupabaseService supabaseService;

    /**
     * Endpoint para verificar la conectividad con Supabase
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> healthCheck() {
        return supabaseService.healthCheck()
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
        return supabaseService.login(loginRequest)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(401).build());
    }

    /**
     * Endpoint para registro
     * POST /api/auth/register
     */
    @PostMapping("/auth/register")
    public Mono<ResponseEntity<LoginResponse>> register(@RequestBody RegisterRequest request) {
        return supabaseService.register(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }


    /**
     * Obtener URL de autorización de Google (Supabase Auth)
     */
    @GetMapping("/auth/google/url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl(@RequestParam(required = false) String redirectTo) {
        String url = supabaseService.buildGoogleAuthUrl(redirectTo);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Finalizar login con Google: recibe accessToken/refreshToken del fragmento
     */
    @PostMapping("/auth/google/finish")
    public Mono<ResponseEntity<LoginResponse>> finishGoogle(@RequestBody GoogleFinishRequest request) {
        return supabaseService.finishGoogleLogin(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    /**
     * Enviar email de recuperación de contraseña
     */
    @PostMapping("/auth/password/reset")
    public Mono<ResponseEntity<Map<String, String>>> sendPasswordReset(@RequestBody PasswordResetRequest request) {
        return supabaseService.sendPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo enviar el correo")));
    }

    /**
     * Aplicar nueva contraseña con el token del enlace
     */
    @PostMapping("/auth/password/apply")
    public Mono<ResponseEntity<Map<String, String>>> applyPassword(@RequestBody PasswordApplyRequest request) {
        return supabaseService.applyPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar la contraseña")));
    }

    /**
     * Completar/actualizar el perfil después de login (Google o email)
     */
    @PostMapping("/auth/onboard")
    public Mono<ResponseEntity<Map<String, String>>> onboard(@RequestBody OnboardRequest request) {
        return supabaseService.onboard(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar el perfil")));
    }
}