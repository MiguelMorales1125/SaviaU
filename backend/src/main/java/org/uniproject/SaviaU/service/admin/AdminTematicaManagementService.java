package org.uniproject.SaviaU.service.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.TematicaAreaDto;
import org.uniproject.SaviaU.dto.TematicaAreaSummaryDto;
import org.uniproject.SaviaU.dto.TematicaResourceDto;
import org.uniproject.SaviaU.dto.admin.AdminTematicaAreaUpsertRequest;
import org.uniproject.SaviaU.dto.admin.AdminTematicaResourceUpsertRequest;
import org.uniproject.SaviaU.service.tematicas.TematicaContentService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTematicaManagementService {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAPS = new ParameterizedTypeReference<>() {};

    private final SupabaseClients clients;
    private final AdminAuthService adminAuthService;
    private final TematicaContentService tematicaContentService;

    public Mono<List<TematicaAreaSummaryDto>> listAreas(String adminToken) {
        return adminAuthService.requireAdmin(adminToken)
                .then(tematicaContentService.listAreas());
    }

    public Mono<TematicaAreaDto> getArea(String adminToken, String areaId) {
        if (areaId == null || areaId.isBlank()) {
            return Mono.error(new RuntimeException("areaId es obligatorio"));
        }
        return adminAuthService.requireAdmin(adminToken)
                .then(tematicaContentService.getArea(areaId));
    }

    public Mono<TematicaAreaDto> upsertArea(String adminToken, AdminTematicaAreaUpsertRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            return Mono.error(new RuntimeException("El nombre de la temática es obligatorio"));
        }
        return adminAuthService.requireAdmin(adminToken)
                .then(Mono.defer(() -> upsertAreaInternal(request)));
    }

    public Mono<TematicaResourceDto> upsertResource(String adminToken, AdminTematicaResourceUpsertRequest request) {
        if (request == null || request.getAreaId() == null || request.getAreaId().isBlank()) {
            return Mono.error(new RuntimeException("Debes seleccionar una temática"));
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            return Mono.error(new RuntimeException("El título del recurso es obligatorio"));
        }
        return adminAuthService.requireAdmin(adminToken)
                .then(Mono.defer(() -> upsertResourceInternal(request)));
    }

    public Mono<Void> deleteResource(String adminToken, String resourceId) {
        if (resourceId == null || resourceId.isBlank()) {
            return Mono.error(new RuntimeException("resourceId es obligatorio"));
        }
        return adminAuthService.requireAdmin(adminToken)
                .then(deleteResourceCascade(resourceId));
    }

    public Mono<Void> deleteArea(String adminToken, String areaId) {
        if (areaId == null || areaId.isBlank()) {
            return Mono.error(new RuntimeException("areaId es obligatorio"));
        }
        return adminAuthService.requireAdmin(adminToken)
                .then(deleteAreaCascade(areaId));
    }

    private Mono<TematicaAreaDto> upsertAreaInternal(AdminTematicaAreaUpsertRequest request) {
        log.info("🔧 upsertArea - Request: id={}, name={}", request.getId(), request.getName());
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", request.getName());
        payload.put("summary", request.getSummary());
        payload.put("accent_color", request.getAccentColor());
        payload.put("hero_image", request.getHeroImage());
        payload.put("tagline", request.getTagline());
        
        log.info("🔧 upsertArea - Payload: {}", payload);

        // Si hay ID, es una actualización (PATCH), si no hay ID es creación (POST)
        WebClient.RequestHeadersSpec<?> request2;
        if (request.getId() != null && !request.getId().isBlank()) {
            // Actualización
            log.info("🔧 upsertArea - Updating existing area with ID: {}", request.getId());
            request2 = adminDb().patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tematicas_areas")
                            .queryParam("id", "eq." + request.getId())
                            .build())
                    .header("Prefer", "return=representation")
                    .bodyValue(payload);
        } else {
            // Creación
            log.info("🔧 upsertArea - Creating new area");
            request2 = adminDb().post()
                    .uri("/tematicas_areas")
                    .header("Prefer", "return=representation")
                    .bodyValue(payload);
        }

        return request2.retrieve()
                .bodyToMono(LIST_OF_MAPS)
                .doOnError(error -> {
                    log.error("❌ upsertArea - Error from Supabase: {}", error.getMessage(), error);
                })
                .map(rows -> {
                    log.info("✅ upsertArea - Response from Supabase: {}", rows);
                    return rows.get(0);
                })
                .flatMap(row -> {
                    String areaId = Objects.toString(row.get("id"), null);
                    if (areaId == null) {
                        return Mono.error(new RuntimeException("No se pudo obtener la temática"));
                    }
                    List<String> focus = Optional.ofNullable(request.getLearningFocus()).orElse(List.of());
                    return syncLearningFocus(areaId, focus)
                            .then(tematicaContentService.getArea(areaId));
                });
    }

    private Mono<TematicaResourceDto> upsertResourceInternal(AdminTematicaResourceUpsertRequest request) {
        log.info("🔧 upsertResource - Request: id={}, areaId={}, title={}", 
                request.getId(), request.getAreaId(), request.getTitle());
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("area_id", request.getAreaId());
        payload.put("title", request.getTitle());
        payload.put("short_description", request.getShortDescription());
        payload.put("detail_description", request.getDetailDescription());
        payload.put("image_url", request.getImageUrl());
        payload.put("format", request.getFormat());
        payload.put("estimated_time", request.getEstimatedTime());
        payload.put("fun_fact", request.getFunFact());
        payload.put("deep_dive", request.getDeepDive());
        payload.put("is_highlighted", request.getHighlighted() != null ? request.getHighlighted() : false);
        
        log.info("🔧 upsertResource - Payload: {}", payload);
        
        // Si hay ID, es una actualización (PATCH), si no hay ID es creación (POST)
        WebClient.RequestHeadersSpec<?> request2;
        if (request.getId() != null && !request.getId().isBlank()) {
            // Actualización
            log.info("🔧 upsertResource - Updating existing resource with ID: {}", request.getId());
            request2 = adminDb().patch()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tematicas_resources")
                            .queryParam("id", "eq." + request.getId())
                            .build())
                    .header("Prefer", "return=representation")
                    .bodyValue(payload);
        } else {
            // Creación
            log.info("🔧 upsertResource - Creating new resource");
            request2 = adminDb().post()
                    .uri("/tematicas_resources")
                    .header("Prefer", "return=representation")
                    .bodyValue(payload);
        }

        return request2.retrieve()
                .bodyToMono(LIST_OF_MAPS)
                .doOnError(error -> {
                    log.error("❌ upsertResource - Error from Supabase: {}", error.getMessage(), error);
                })
                .map(rows -> {
                    log.info("✅ upsertResource - Response from Supabase: {}", rows);
                    return rows.get(0);
                })
                .flatMap(row -> {
                    String resourceId = Objects.toString(row.get("id"), null);
                    if (resourceId == null) {
                        return Mono.error(new RuntimeException("No se pudo obtener el recurso"));
                    }
                    List<String> sources = Optional.ofNullable(request.getSources()).orElse(List.of());
                    return syncResourceSources(resourceId, sources)
                            .then(tematicaContentService.getResource(request.getAreaId(), resourceId));
                });
    }

    private Mono<Void> syncLearningFocus(String areaId, List<String> labels) {
        Mono<Void> deleteExisting = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_learning_focus")
                        .queryParam("area_id", "eq." + areaId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron limpiar los focos de {}: {}", areaId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron actualizar los focos"));
                });

        List<Map<String, Object>> rows = labels.stream()
            .map(label -> label == null ? null : label.trim())
            .filter(value -> value != null && !value.isBlank())
            .map(value -> {
                Map<String, Object> map = new HashMap<>();
                map.put("area_id", areaId);
                map.put("label", value);
                return map;
            })
            .collect(Collectors.toList());

        if (rows.isEmpty()) {
            return deleteExisting;
        }

        Mono<Void> insert = adminDb().post()
                .uri("/tematicas_learning_focus")
                .header("Prefer", "return=minimal")
                .bodyValue(rows)
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron insertar focos para {}: {}", areaId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron guardar los focos"));
                });

        return deleteExisting.then(insert);
    }

    private Mono<Void> syncResourceSources(String resourceId, List<String> sources) {
        Mono<Void> deleteExisting = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_resource_sources")
                        .queryParam("resource_id", "eq." + resourceId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron limpiar fuentes de {}: {}", resourceId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron actualizar las fuentes"));
                });

        List<Map<String, Object>> rows = sources.stream()
            .map(source -> source == null ? null : source.trim())
            .filter(value -> value != null && !value.isBlank())
            .map(value -> {
                Map<String, Object> map = new HashMap<>();
                map.put("resource_id", resourceId);
                map.put("source", value);
                return map;
            })
            .collect(Collectors.toList());

        if (rows.isEmpty()) {
            return deleteExisting;
        }

        Mono<Void> insert = adminDb().post()
                .uri("/tematicas_resource_sources")
                .header("Prefer", "return=minimal")
                .bodyValue(rows)
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron insertar fuentes para {}: {}", resourceId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron guardar las fuentes"));
                });

        return deleteExisting.then(insert);
    }

    private Mono<Void> deleteResourceCascade(String resourceId) {
        Mono<Void> deleteSources = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_resource_sources")
                        .queryParam("resource_id", "eq." + resourceId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron eliminar fuentes del recurso {}: {}", resourceId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron eliminar las fuentes del recurso"));
                });

        Mono<Void> deleteResource = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_resources")
                        .queryParam("id", "eq." + resourceId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudo eliminar el recurso {}: {}", resourceId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo eliminar el recurso"));
                });

        return deleteSources.then(deleteResource);
    }

    private Mono<Void> deleteAreaCascade(String areaId) {
        Mono<Void> deleteResources = fetchResourceIds(areaId)
                .flatMap(ids -> Flux.fromIterable(ids)
                        .flatMap(this::deleteResourceCascade)
                        .then());

        Mono<Void> deleteFocus = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_learning_focus")
                        .queryParam("area_id", "eq." + areaId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron eliminar focos de {}: {}", areaId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron eliminar los focos"));
                });

        Mono<Void> deleteArea = adminDb().method(HttpMethod.DELETE)
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_areas")
                        .queryParam("id", "eq." + areaId)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .then()
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudo eliminar la temática {}: {}", areaId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudo eliminar la temática"));
                });

        return deleteResources.then(deleteFocus).then(deleteArea);
    }

    private Mono<List<String>> fetchResourceIds(String areaId) {
        return adminDb().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tematicas_resources")
                        .queryParam("select", "id")
                        .queryParam("area_id", "eq." + areaId)
                        .build())
                .retrieve()
                .bodyToMono(LIST_OF_MAPS)
                .map(rows -> rows.stream()
                        .map(row -> Objects.toString(row.get("id"), null))
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList()))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.warn("No se pudieron obtener recursos de {}: {}", areaId, ex.getResponseBodyAsString());
                    return Mono.error(new RuntimeException("No se pudieron consultar los recursos"));
                });
    }

    private WebClient adminDb() {
        return clients.getDbAdmin();
    }
}
