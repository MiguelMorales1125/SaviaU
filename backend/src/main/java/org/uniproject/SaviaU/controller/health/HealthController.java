package org.uniproject.SaviaU.controller.health;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.service.health.HealthService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HealthController {

    private final HealthService healthService;

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
}

