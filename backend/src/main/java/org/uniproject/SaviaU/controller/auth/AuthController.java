package org.uniproject.SaviaU.controller.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.GoogleFinishRequest;
import org.uniproject.SaviaU.dto.LoginRequest;
import org.uniproject.SaviaU.dto.LoginResponse;
import org.uniproject.SaviaU.dto.RegisterRequest;
import org.uniproject.SaviaU.service.auth.AuthService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Mono<ResponseEntity<LoginResponse>> login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(401).build());
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<LoginResponse>> register(@RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    @GetMapping("/google/url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl(@RequestParam(required = false) String redirectTo) {
        String url = authService.buildGoogleAuthUrl(redirectTo);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/google/finish")
    public Mono<ResponseEntity<LoginResponse>> finishGoogle(@RequestBody GoogleFinishRequest request) {
        return authService.finishGoogleLogin(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }
}

