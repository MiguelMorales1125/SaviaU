package org.uniproject.SaviaU.controller.profile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.codec.multipart.FilePart;
import org.uniproject.SaviaU.dto.ProfileUpdateRequest;
import org.uniproject.SaviaU.service.profile.ProfileService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentProfileController {

    private final ProfileService profileService;

    @GetMapping
    public Mono<ResponseEntity<Map<String, Object>>> getProfile(@RequestParam String accessToken) {
        return profileService.getProfile(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo obtener el perfil")));
    }

    @PatchMapping
    public Mono<ResponseEntity<Map<String, Object>>> patchProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.patchProfile(request)
                .map(ResponseEntity::ok)
                .onErrorResume(IllegalArgumentException.class, ex -> Mono.just(ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()))))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo actualizar el perfil")));
    }

    @PostMapping(path = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> uploadPhoto(@RequestPart("file") FilePart file,
                                                                 @RequestParam String accessToken) {
        return profileService.uploadPhoto(accessToken, file)
                .map(ResponseEntity::ok)
                .onErrorResume(IllegalArgumentException.class, ex -> Mono.just(ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()))))
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo subir la foto")));
    }
}

