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
    public Mono<ResponseEntity<Object>> start(@RequestBody TriviaStartRequest request) {
        return triviaService.start(request)
                .map(body -> ResponseEntity.ok().body((Object) body))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()))));
    }

    // Responder una pregunta (retroalimentación inmediata)
    @PostMapping("/answer")
    public Mono<ResponseEntity<Object>> answer(@RequestBody TriviaAnswerRequest request) {
        return triviaService.answer(request)
                .map(body -> ResponseEntity.ok().body((Object) body))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()))));
    }

    // Finalizar intento y obtener resultado
    @PostMapping("/finish")
    public Mono<ResponseEntity<Object>> finish(@RequestBody TriviaFinishRequest request) {
        return triviaService.finish(request)
                .map(body -> ResponseEntity.ok().body((Object) body))
                .onErrorResume(ex -> Mono.just(ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()))));
    }

    // Obtener resultado de un intento (requiere accessToken y attemptId)
    @GetMapping("/result")
    public Mono<ResponseEntity<Object>> getResult(@RequestParam String accessToken, @RequestParam String attemptId) {
        return triviaService.getResult(accessToken, attemptId)
                .map(body -> ResponseEntity.ok().body((Object) body))
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(404).body(Map.of("message", ex.getMessage()))));
    }

    @GetMapping("/stats")
    public Mono<ResponseEntity<Object>> getStats(@RequestParam String accessToken) {
        return triviaService.getStats(accessToken)
                .map(body -> ResponseEntity.ok().body((Object) body))
                .onErrorResume(ex -> Mono.just(ResponseEntity.status(400).body(Map.of("message", ex.getMessage()))));
    }
}

