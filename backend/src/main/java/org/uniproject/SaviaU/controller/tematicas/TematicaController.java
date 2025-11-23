package org.uniproject.SaviaU.controller.tematicas;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.TematicaAreaSummaryDto;
import org.uniproject.SaviaU.service.tematicas.TematicaContentService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tematicas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TematicaController {

    private final TematicaContentService tematicaContentService;

    @GetMapping("/areas")
    public Mono<ResponseEntity<List<TematicaAreaSummaryDto>>> listAreas() {
        return tematicaContentService.listAreas()
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(500).body(List.of())));
    }

    @GetMapping("/areas/{areaId}")
    public Mono<ResponseEntity<Object>> getArea(@PathVariable String areaId) {
        return tematicaContentService.getArea(areaId)
                .map(area -> ResponseEntity.ok().body((Object) area))
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(404).body((Object) Map.of("message", ex.getMessage()))));
    }

    @GetMapping("/areas/{areaId}/resources/{resourceId}")
    public Mono<ResponseEntity<Object>> getResource(@PathVariable String areaId, @PathVariable String resourceId) {
        return tematicaContentService.getResource(areaId, resourceId)
                .map(resource -> ResponseEntity.ok().body((Object) resource))
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(404).body((Object) Map.of("message", ex.getMessage()))));
    }
}
