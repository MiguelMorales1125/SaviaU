package org.uniproject.SaviaU.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.uniproject.SaviaU.dto.TematicaAreaDto;
import org.uniproject.SaviaU.dto.TematicaAreaSummaryDto;
import org.uniproject.SaviaU.dto.TematicaResourceDto;
import org.uniproject.SaviaU.dto.admin.AdminTematicaAreaUpsertRequest;
import org.uniproject.SaviaU.dto.admin.AdminTematicaResourceUpsertRequest;
import org.uniproject.SaviaU.service.admin.AdminTematicaManagementService;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tematicas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminTematicaController {

    private final AdminTematicaManagementService tematicaService;

    @GetMapping("/areas")
    public Mono<List<TematicaAreaSummaryDto>> listAreas(@RequestHeader("Authorization") String authorization) {
        return tematicaService.listAreas(extractToken(authorization));
    }

    @GetMapping("/areas/{areaId}")
    public Mono<TematicaAreaDto> getArea(@RequestHeader("Authorization") String authorization,
                                         @PathVariable String areaId) {
        return tematicaService.getArea(extractToken(authorization), areaId);
    }

    @PostMapping("/areas")
    public Mono<TematicaAreaDto> upsertArea(@RequestHeader("Authorization") String authorization,
                                            @RequestBody AdminTematicaAreaUpsertRequest request) {
        return tematicaService.upsertArea(extractToken(authorization), request);
    }

    @DeleteMapping("/areas/{areaId}")
    public Mono<Void> deleteArea(@RequestHeader("Authorization") String authorization,
                                 @PathVariable String areaId) {
        return tematicaService.deleteArea(extractToken(authorization), areaId);
    }

    @PostMapping("/resources")
    public Mono<TematicaResourceDto> upsertResource(@RequestHeader("Authorization") String authorization,
                                                    @RequestBody AdminTematicaResourceUpsertRequest request) {
        return tematicaService.upsertResource(extractToken(authorization), request);
    }

    @DeleteMapping("/resources/{resourceId}")
    public Mono<Void> deleteResource(@RequestHeader("Authorization") String authorization,
                                     @PathVariable String resourceId) {
        return tematicaService.deleteResource(extractToken(authorization), resourceId);
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization inválido");
        }
        return header.substring("Bearer ".length()).trim();
    }
}
