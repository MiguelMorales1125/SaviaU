package org.uniproject.SaviaU.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.uniproject.SaviaU.dto.TriviaSetDto;
import org.uniproject.SaviaU.dto.admin.*;
import org.uniproject.SaviaU.service.admin.AdminTriviaManagementService;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/admin/trivia")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminTriviaController {

    private final AdminTriviaManagementService triviaService;

    @GetMapping("/sets")
    public Mono<List<TriviaSetDto>> listSets(@RequestHeader("Authorization") String authorization) {
        return triviaService.listSets(extractToken(authorization));
    }

    @PostMapping("/sets")
    public Mono<TriviaSetDto> upsertSet(@RequestHeader("Authorization") String authorization,
                                        @RequestBody AdminTriviaSetUpsertRequest request) {
        return triviaService.upsertSet(extractToken(authorization), request);
    }

    @GetMapping("/questions")
    public Mono<List<AdminTriviaQuestionDto>> listQuestions(@RequestHeader("Authorization") String authorization,
                                                            @RequestParam(value = "setId", required = false) String setId) {
        return triviaService.listQuestions(extractToken(authorization), setId);
    }

    @PostMapping("/questions")
    public Mono<AdminTriviaQuestionDto> createQuestion(@RequestHeader("Authorization") String authorization,
                                                       @RequestBody AdminTriviaQuestionUpsertRequest request) {
        return triviaService.createQuestion(extractToken(authorization), request);
    }

    @PutMapping("/questions/{questionId}")
    public Mono<AdminTriviaQuestionDto> updateQuestion(@RequestHeader("Authorization") String authorization,
                                                       @PathVariable String questionId,
                                                       @RequestBody AdminTriviaQuestionUpsertRequest request) {
        return triviaService.updateQuestion(extractToken(authorization), questionId, request);
    }

    @DeleteMapping("/questions/{questionId}")
    public Mono<Void> deleteQuestion(@RequestHeader("Authorization") String authorization,
                                     @PathVariable String questionId) {
        return triviaService.deleteQuestion(extractToken(authorization), questionId);
    }

    @GetMapping("/leaderboard")
    public Mono<List<AdminLeaderboardRowDto>> leaderboard(@RequestHeader("Authorization") String authorization,
                                                          @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return triviaService.getLeaderboard(extractToken(authorization), limit);
    }

    @GetMapping("/progress/{userId}")
    public Mono<AdminUserProgressDto> userProgress(@RequestHeader("Authorization") String authorization,
                                                   @PathVariable String userId) {
        return triviaService.getUserProgress(extractToken(authorization), userId);
    }

    @GetMapping("/progress")
    public Mono<List<AdminUserProgressDto>> cohortProgress(@RequestHeader("Authorization") String authorization,
                                                           @RequestParam(value = "limit", defaultValue = "40") int limit) {
        return triviaService.getCohortProgress(extractToken(authorization), limit);
    }

    private String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization inválido");
        }
        return header.substring("Bearer ".length()).trim();
    }
}
