package org.uniproject.SaviaU.service.tematicas;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriBuilder;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.TematicaAreaDto;
import org.uniproject.SaviaU.dto.TematicaAreaSummaryDto;
import org.uniproject.SaviaU.dto.TematicaResourceDto;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TematicaContentService {

    private static final String SUMMARY_SELECT = String.join(",",
            "id",
            "name",
            "summary",
            "accent_color",
            "hero_image",
            "tagline",
            "tematicas_learning_focus(label)",
            "tematicas_resources(id)"
    );

    private static final String FULL_SELECT = String.join(",",
            "id",
            "name",
            "summary",
            "accent_color",
            "hero_image",
            "tagline",
            "tematicas_learning_focus(label)",
            "tematicas_resources("
                    + String.join(",",
                    "id",
                    "area_id",
                    "title",
                    "short_description",
                    "detail_description",
                    "image_url",
                    "format",
                    "estimated_time",
                    "fun_fact",
                    "deep_dive",
                    "tematicas_resource_sources(source)")
                    + ")"
    );

    private static final ParameterizedTypeReference<List<AreaRow>> AREA_LIST_TYPE = new ParameterizedTypeReference<>() {};

    private final SupabaseClients supabaseClients;

    public Mono<List<TematicaAreaSummaryDto>> listAreas() {
        return fetchAreas(SUMMARY_SELECT, null)
                .map(rows -> rows.stream()
                        .map(this::mapToSummary)
                        .collect(Collectors.toList()));
    }

    public Mono<TematicaAreaDto> getArea(String id) {
        return fetchSingleArea(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Temática no encontrada")));
    }

    public Mono<TematicaResourceDto> getResource(String areaId, String resourceId) {
        return fetchSingleArea(areaId)
                .switchIfEmpty(Mono.error(new RuntimeException("Temática no encontrada")))
                .flatMap(area -> area.getResources().stream()
                        .filter(r -> Objects.equals(r.getId(), resourceId))
                        .findFirst()
                        .map(Mono::just)
                        .orElseGet(() -> Mono.error(new RuntimeException("Recurso no encontrado"))));
    }

    private Mono<TematicaAreaDto> fetchSingleArea(String id) {
        return fetchAreas(FULL_SELECT, id)
                .map(rows -> rows.stream().findFirst())
                .flatMap(optional -> optional.map(row -> Mono.just(mapToArea(row))).orElseGet(Mono::empty));
    }

    private Mono<List<AreaRow>> fetchAreas(String select, String areaId) {
        WebClient client = supabaseClients.getDbAdmin();
        return client.get()
                .uri(builder -> buildAreasUri(builder, select, areaId))
                .retrieve()
                .bodyToMono(AREA_LIST_TYPE)
                .onErrorResume(ex -> {
                    log.error("Error consultando temáticas en Supabase", ex);
                    return Mono.error(new RuntimeException("No se pudieron cargar las temáticas desde Supabase"));
                });
    }

    private URI buildAreasUri(UriBuilder builder, String select, String areaId) {
        UriBuilder uriBuilder = builder
                .path("/tematicas_areas")
                .queryParam("select", select)
                .queryParam("order", "name.asc");
        if (areaId != null) {
            uriBuilder.queryParam("id", "eq." + areaId);
        }
        return uriBuilder.build();
    }

    private TematicaAreaSummaryDto mapToSummary(AreaRow row) {
        List<String> focus = safeList(row.learningFocus()).stream()
                .map(FocusRow::label)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        int resourceCount = safeList(row.resources()).size();
        return TematicaAreaSummaryDto.builder()
                .id(row.id())
                .name(row.name())
                .summary(row.summary())
                .accentColor(row.accentColor())
                .heroImage(row.heroImage())
                .resourceCount(resourceCount)
                .keywords(focus)
                .build();
    }

    private TematicaAreaDto mapToArea(AreaRow row) {
        List<String> focus = safeList(row.learningFocus()).stream()
                .map(FocusRow::label)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        List<TematicaResourceDto> resources = safeList(row.resources()).stream()
                .map(this::mapToResource)
                .collect(Collectors.toList());
        return TematicaAreaDto.builder()
                .id(row.id())
                .name(row.name())
                .summary(row.summary())
                .accentColor(row.accentColor())
                .heroImage(row.heroImage())
                .tagline(row.tagline())
                .learningFocus(focus)
                .resources(resources)
                .build();
    }

    private TematicaResourceDto mapToResource(ResourceRow row) {
        List<String> sources = safeList(row.sources()).stream()
                .map(ResourceSourceRow::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        return TematicaResourceDto.builder()
                .id(row.id())
                .title(row.title())
                .shortDescription(row.shortDescription())
                .detailDescription(row.detailDescription())
                .imageUrl(row.imageUrl())
                .format(row.format())
                .estimatedTime(row.estimatedTime())
                .funFact(row.funFact())
                .deepDive(row.deepDive())
                .sources(sources)
                .build();
    }

    private <T> List<T> safeList(List<T> source) {
        return source == null ? Collections.emptyList() : source;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AreaRow(
            String id,
            String name,
            String summary,
            @JsonProperty("accent_color") String accentColor,
            @JsonProperty("hero_image") String heroImage,
            String tagline,
            @JsonProperty("tematicas_learning_focus") List<FocusRow> learningFocus,
            @JsonProperty("tematicas_resources") List<ResourceRow> resources
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record FocusRow(String label) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ResourceRow(
            String id,
            @JsonProperty("area_id") String areaId,
            String title,
            @JsonProperty("short_description") String shortDescription,
            @JsonProperty("detail_description") String detailDescription,
            @JsonProperty("image_url") String imageUrl,
            String format,
            @JsonProperty("estimated_time") String estimatedTime,
            @JsonProperty("fun_fact") String funFact,
            @JsonProperty("deep_dive") String deepDive,
            @JsonProperty("tematicas_resource_sources") List<ResourceSourceRow> sources
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ResourceSourceRow(String source) {}
}
