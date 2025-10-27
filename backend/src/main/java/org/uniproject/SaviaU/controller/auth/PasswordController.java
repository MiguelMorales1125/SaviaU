package org.uniproject.SaviaU.controller.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.PasswordApplyRequest;
import org.uniproject.SaviaU.dto.PasswordResetRequest;
import org.uniproject.SaviaU.service.auth.PasswordService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PasswordController {

    private final PasswordService passwordService;

    @PostMapping("/reset")
    public Mono<ResponseEntity<Map<String, String>>> sendPasswordReset(@RequestBody PasswordResetRequest request) {
        return passwordService.sendPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo enviar el correo")));
    }

    @PostMapping("/apply")
    public Mono<ResponseEntity<Map<String, String>>> applyPassword(@RequestBody PasswordApplyRequest request) {
        return passwordService.applyPasswordReset(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar la contraseña")));
    }
}

