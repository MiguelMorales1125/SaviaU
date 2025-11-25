package org.uniproject.SaviaU.controller.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.OnboardRequest;
import org.uniproject.SaviaU.dto.UserRankingDto;
import org.uniproject.SaviaU.service.profile.OnboardingService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final OnboardingService onboardingService;

    @PostMapping("/onboard")
    public Mono<ResponseEntity<Map<String, String>>> onboard(@RequestBody OnboardRequest request) {
        return onboardingService.onboard(request)
                .map(msg -> ResponseEntity.ok(Map.of("message", msg)))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar el perfil")));
    }

    @GetMapping("/profile/status")
    public Mono<ResponseEntity<Map<String, Object>>> profileStatus(@RequestParam String accessToken) {
        return onboardingService.profileStatus(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo obtener el estado de perfil")));
    }

    @GetMapping("/profile")
    public Mono<ResponseEntity<Map<String, Object>>> getProfile(@RequestParam String accessToken) {
        return onboardingService.getProfile(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo obtener el perfil")));
    }

    @GetMapping("/ranking")
    public Mono<ResponseEntity<List<UserRankingDto>>> getRanking(
            @RequestParam String accessToken,
            @RequestParam(defaultValue = "50") int limit) {
        return onboardingService.getUserRanking(accessToken, limit)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }
}
