package org.uniproject.SaviaU.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.AdminLoginRequest;
import org.uniproject.SaviaU.dto.AdminLoginResponse;
import org.uniproject.SaviaU.dto.AdminPasswordResetRequest;
import org.uniproject.SaviaU.dto.PasswordApplyRequest;
import org.uniproject.SaviaU.service.admin.AdminAuthService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public Mono<ResponseEntity<AdminLoginResponse>> login(@RequestBody AdminLoginRequest request) {
        return adminAuthService.login(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(401).build());
    }

    @PostMapping("/password/reset")
    public Mono<ResponseEntity<Map<String, String>>> sendPasswordReset(@RequestBody AdminPasswordResetRequest request) {
        return adminAuthService.sendPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(200).body(Map.of("message", "Si el correo existe, se envió un enlace de recuperación")));
    }

    @PostMapping("/password/apply")
    public Mono<ResponseEntity<Map<String, String>>> applyPassword(@RequestBody PasswordApplyRequest request) {
        return adminAuthService.applyPassword(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar la contraseña")));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout() {
        return adminAuthService.logout()
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)));
    }
}

