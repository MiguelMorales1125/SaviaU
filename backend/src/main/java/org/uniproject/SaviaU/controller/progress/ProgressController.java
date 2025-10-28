package org.uniproject.SaviaU.controller.progress;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.service.progress.ProgressService;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/overview")
    public Mono<ResponseEntity<ProgressOverviewDto>> overview(@RequestParam String accessToken) {
        return progressService.getOverview(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    @GetMapping("/badges")
    public Mono<ResponseEntity<List<BadgeDto>>> badges(@RequestParam String accessToken) {
        return progressService.getUserBadges(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    @PostMapping("/activity")
    public Mono<ResponseEntity<AwardResultDto>> recordActivity(@RequestBody RecordActivityRequest request) {
        return progressService.recordActivity(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }
}

