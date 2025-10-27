package org.uniproject.SaviaU.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.service.auth.AuthService;
import org.uniproject.SaviaU.service.auth.PasswordService;
import org.uniproject.SaviaU.service.profile.OnboardingService;
import org.uniproject.SaviaU.service.diagnostic.DiagnosticService;
import org.uniproject.SaviaU.service.health.HealthService;

/**
 * Fachada ligera para mantener compatibilidad con código legado.
 * Delegamos toda la lógica en servicios especializados.
 */
@Service
@RequiredArgsConstructor
public class SupabaseService {

    private final AuthService authService;
    private final PasswordService passwordService;
    private final OnboardingService onboardingService;
    private final DiagnosticService diagnosticService;
    private final HealthService healthService;

    // ====== Auth ======
    public Mono<LoginResponse> login(LoginRequest loginRequest) { return authService.login(loginRequest); }
    public Mono<LoginResponse> register(RegisterRequest request) { return authService.register(request); }
    public String buildGoogleAuthUrl(String redirectTo) { return authService.buildGoogleAuthUrl(redirectTo); }
    public Mono<LoginResponse> finishGoogleLogin(GoogleFinishRequest request) { return authService.finishGoogleLogin(request); }

    // ====== Password ======
    public Mono<String> sendPasswordReset(PasswordResetRequest request) { return passwordService.sendPasswordReset(request); }
    public Mono<String> applyPasswordReset(PasswordApplyRequest request) { return passwordService.applyPasswordReset(request); }

    // ====== Perfil ======
    public Mono<String> onboard(OnboardRequest request) { return onboardingService.onboard(request); }

    // ====== Health ======
    public Mono<Boolean> healthCheck() { return healthService.healthCheck(); }

    // ====== Diagnóstico ======
    public Mono<List<DiagnosticQuestionDto>> getDiagnosticQuestions() { return diagnosticService.getQuestions(); }
    public Mono<Map<String, Object>> diagnosticStatus(String accessToken) { return diagnosticService.getStatus(accessToken); }
    public Mono<DiagnosticResultDto> submitDiagnostic(DiagnosticSubmitRequest request) { return diagnosticService.submit(request); }
    public Mono<DiagnosticResultDto> getLastDiagnosticResult(String accessToken) { return diagnosticService.getLastResult(accessToken); }
}
