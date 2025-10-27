package org.uniproject.SaviaU.controller.diagnostic;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.uniproject.SaviaU.dto.DiagnosticQuestionDto;
import org.uniproject.SaviaU.dto.DiagnosticResultDto;
import org.uniproject.SaviaU.dto.DiagnosticSubmitRequest;
import org.uniproject.SaviaU.service.diagnostic.DiagnosticService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    @GetMapping("/questions")
    public Mono<ResponseEntity<List<DiagnosticQuestionDto>>> getDiagnosticQuestions() {
        return diagnosticService.getQuestions()
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    @GetMapping("/status")
    public Mono<ResponseEntity<Map<String, Object>>> diagnosticStatus(@RequestParam String accessToken) {
        return diagnosticService.getStatus(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).body(Map.of("message", "No se pudo obtener el estado")));
    }

    @PostMapping("/submit")
    public Mono<ResponseEntity<DiagnosticResultDto>> submitDiagnostic(@RequestBody DiagnosticSubmitRequest request) {
        return diagnosticService.submit(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(400).build());
    }

    @GetMapping("/result")
    public Mono<ResponseEntity<DiagnosticResultDto>> getLastResult(@RequestParam String accessToken) {
        return diagnosticService.getLastResult(accessToken)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(404).build());
    }
}

