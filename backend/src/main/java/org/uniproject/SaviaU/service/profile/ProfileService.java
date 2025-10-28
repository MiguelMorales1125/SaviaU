package org.uniproject.SaviaU.service.profile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.config.SupabaseProperties;
import org.uniproject.SaviaU.dto.ProfileUpdateRequest;
import reactor.core.publisher.Mono;
import org.springframework.core.io.buffer.DataBufferUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final long MAX_IMAGE_BYTES = 2_000_000L; // 2MB
    private static final Set<String> ALLOWED_CT = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp"
    );

    private final SupabaseClients clients;

    public Mono<Map<String, Object>> getProfile(String accessToken) {
        return getUserFromToken(accessToken)
                .flatMap(user -> {
                    String id = (String) user.get("id");
                    String email = (String) user.get("email");
                    return clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("select", "id,full_name,carrera,universidad,semestre,alias,intereses,photo_url,avatar_key,updated_at")
                                    .queryParam("id", "eq." + id)
                                    .build())
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .collectList()
                            .map(list -> {
                                Map<String, Object> base = new HashMap<>();
                                base.put("userId", id);
                                base.put("email", email);
                                if (list.isEmpty()) {
                                    base.put("exists", false);
                                    base.put("profile", null);
                                    return base;
                                }
                                @SuppressWarnings("unchecked") Map<String, Object> row = (Map<String, Object>) list.get(0);
                                Map<String, Object> profile = new HashMap<>();
                                profile.put("fullName", row.get("full_name"));
                                profile.put("carrera", row.get("carrera"));
                                profile.put("universidad", row.get("universidad"));
                                profile.put("semestre", row.get("semestre"));
                                profile.put("alias", row.get("alias"));
                                profile.put("intereses", row.get("intereses"));
                                profile.put("photoUrl", row.get("photo_url"));
                                profile.put("avatarKey", row.get("avatar_key"));
                                profile.put("updatedAt", row.get("updated_at"));
                                base.put("exists", true);
                                base.put("profile", profile);
                                return base;
                            });
                });
    }

    public Mono<Map<String, Object>> patchProfile(ProfileUpdateRequest request) {
        return getUserFromToken(request.getAccessToken())
                .flatMap(user -> {
                    String id = (String) user.get("id");
                    Map<String, Object> update = new LinkedHashMap<>();
                    if (request.getAlias() != null) update.put("alias", request.getAlias());
                    if (request.getCarrera() != null) update.put("carrera", request.getCarrera());
                    if (request.getSemestre() != null) update.put("semestre", request.getSemestre());
                    if (request.getIntereses() != null) update.put("intereses", request.getIntereses());
                    if (request.getAvatarKey() != null) {
                        update.put("avatar_key", request.getAvatarKey());
                        update.put("photo_url", null); // si elige avatar, limpiar foto personalizada
                    }
                    if (update.isEmpty()) {
                        return Mono.just(Map.of("message", "Sin cambios"));
                    }
                    update.put("updated_at", Instant.now().toString());

                    return clients.getDbAdmin().patch()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("id", "eq." + id)
                                    .build())
                            .header("Prefer", "return=representation")
                            .bodyValue(update)
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .next()
                            .onErrorResume(WebClientResponseException.class, ex -> {
                                log.error("Error actualizando perfil: {}", ex.getResponseBodyAsString(StandardCharsets.UTF_8));
                                return Mono.error(new RuntimeException("No se pudo actualizar el perfil"));
                            })
                            .map(row -> {
                                Map<String, Object> resp = new HashMap<>();
                                resp.put("message", "Perfil actualizado");
                                resp.put("profile", row);
                                return resp;
                            });
                });
    }

    public Mono<Map<String, Object>> uploadPhoto(String accessToken, FilePart file) {
        String ct = Optional.ofNullable(file.headers().getContentType())
                .map(MediaType::toString)
                .orElse("");
        if (!ALLOWED_CT.contains(ct)) {
            return Mono.error(new IllegalArgumentException("Tipo de archivo no permitido"));
        }
        return DataBufferUtils.join(file.content())
                .flatMap(db -> {
                    long size = db.readableByteCount();
                    if (size > MAX_IMAGE_BYTES) {
                        DataBufferUtils.release(db);
                        return Mono.error(new IllegalArgumentException("La foto supera el tamaño máximo de 2MB"));
                    }
                    byte[] bytes = new byte[(int) size];
                    db.read(bytes);
                    DataBufferUtils.release(db);
                    return getUserFromToken(accessToken)
                            .flatMap(user -> {
                                String id = (String) user.get("id");
                                SupabaseProperties props = clients.getProps();
                                String bucket = props.getProfileBucket();
                                String ext = extFromContentType(ct);
                                String objectPath = "users/" + id + "/profile" + ext;
                                // Subir al Storage
                                return clients.getStorageAdmin().post()
                                        .uri(uriBuilder -> uriBuilder
                                                .path("/object/" + bucket + "/" + objectPath)
                                                .build())
                                        .header("x-upsert", "true")
                                        .contentType(MediaType.parseMediaType(ct))
                                        .body(BodyInserters.fromValue(bytes))
                                        .retrieve()
                                        .bodyToMono(String.class)
                                        .onErrorResume(WebClientResponseException.class, ex -> {
                                            log.error("Error subiendo foto: {}", ex.getResponseBodyAsString(StandardCharsets.UTF_8));
                                            return Mono.error(new RuntimeException("No se pudo subir la foto"));
                                        })
                                        .flatMap(ignored -> {
                                            String publicUrl = props.getUrl() + "/storage/v1/object/public/" + bucket + "/" + objectPath;
                                            Map<String, Object> update = new HashMap<>();
                                            update.put("photo_url", publicUrl);
                                            update.put("avatar_key", null);
                                            update.put("updated_at", Instant.now().toString());
                                            return clients.getDbAdmin().patch()
                                                    .uri(uriBuilder -> uriBuilder
                                                            .path("/usuarios")
                                                            .queryParam("id", "eq." + id)
                                                            .build())
                                                    .header("Prefer", "return=representation")
                                                    .bodyValue(update)
                                                    .retrieve()
                                                    .bodyToFlux(Map.class)
                                                    .next()
                                                    .map(row -> {
                                                        Map<String, Object> resp = new HashMap<>();
                                                        resp.put("message", "Foto actualizada");
                                                        resp.put("photoUrl", publicUrl);
                                                        resp.put("profile", row);
                                                        return resp;
                                                    });
                                        });
                            });
                });
    }

    private Mono<Map<String, Object>> getUserFromToken(String accessToken) {
        return clients.buildUserAuthClient(accessToken)
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(userResp -> {
                    @SuppressWarnings("unchecked") Map<String, Object> user = (Map<String, Object>) userResp;
                    String id = (String) user.get("id");
                    if (id == null) return Mono.error(new RuntimeException("Token inválido"));
                    return Mono.just(user);
                });
    }

    private static String extFromContentType(String ct) {
        if (MediaType.IMAGE_JPEG_VALUE.equals(ct)) return ".jpg";
        if (MediaType.IMAGE_PNG_VALUE.equals(ct)) return ".png";
        if ("image/webp".equals(ct)) return ".webp";
        return "";
    }
}
