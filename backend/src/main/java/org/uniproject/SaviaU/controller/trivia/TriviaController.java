package org.uniproject.SaviaU.controller.trivia;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.*;
import org.uniproject.SaviaU.service.trivia.TriviaService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trivia")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TriviaController {

    private final TriviaService triviaService;

    // Listar trivias disponibles (sets)
    @GetMapping("/sets")
    public Mono<ResponseEntity<List<TriviaSetDto>>> getSets() {
        return triviaService.getSets()
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    // Obtener preguntas de un set (sin revelar respuestas correctas)
    @GetMapping("/{setId}/questions")
    public Mono<ResponseEntity<List<TriviaQuestionDto>>> getQuestions(@PathVariable String setId) {
        return triviaService.getQuestions(setId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    // Iniciar intento de trivia
    @PostMapping("/start")
    public Mono<ResponseEntity<TriviaStartResponse>> start(@RequestBody TriviaStartRequest request) {
        return triviaService.start(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.badRequest().build());
    }

    // Responder una pregunta (retroalimentación inmediata)
    @PostMapping("/answer")
    public Mono<ResponseEntity<TriviaAnswerResponse>> answer(@RequestBody TriviaAnswerRequest request) {
        return triviaService.answer(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.badRequest().build());
    }

    // Finalizar intento y obtener resultado
    @PostMapping("/finish")
    public Mono<ResponseEntity<TriviaResultDto>> finish(@RequestBody TriviaFinishRequest request) {
        return triviaService.finish(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.badRequest().build());
    }

    // Obtener resultado de un intento (requiere accessToken y attemptId)
    @GetMapping("/result")
    public Mono<ResponseEntity<TriviaResultDto>> getResult(@RequestParam String accessToken, @RequestParam String attemptId) {
        return triviaService.getResult(accessToken, attemptId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(404).build());
    }

    @GetMapping("/stats")
    public Mono<ResponseEntity<TriviaStatsDto>> getStats(@RequestParam String accessToken) {
        return triviaService.getStats(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }
}

