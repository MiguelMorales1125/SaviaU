package org.uniproject.SaviaU.service.diagnostic;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.DiagnosticQuestionDto;
import org.uniproject.SaviaU.dto.DiagnosticResultDto;
import org.uniproject.SaviaU.dto.DiagnosticSubmitRequest;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import org.uniproject.SaviaU.service.progress.ProgressService;
import org.uniproject.SaviaU.dto.AwardResultDto;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiagnosticService {

    private final SupabaseClients clients;
    private final ProgressService progressService;

    public Mono<List<DiagnosticQuestionDto>> getQuestions() {
        Mono<List<Map>> qMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/diagnostic_questions")
                        .queryParam("select", "id,prompt,topic,difficulty,is_active")
                        .queryParam("is_active", "eq.true")
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        return qMono.flatMap(qList -> {
            if (qList.isEmpty()) return Mono.just(List.of());
            List<String> qIds = qList.stream().map(m -> (String) m.get("id")).collect(Collectors.toList());
            String inParam = "in.(" + String.join(",", qIds) + ")";
            Mono<List<Map>> oMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_options")
                            .queryParam("select", "id,question_id,text")
                            .queryParam("question_id", inParam)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return oMono.map(opts -> {
                Map<String, List<Map>> byQ = opts.stream().collect(Collectors.groupingBy(m -> (String) m.get("question_id")));
                List<DiagnosticQuestionDto> dto = new ArrayList<>();
                for (Map q : qList) {
                    String qid = (String) q.get("id");
                    List<DiagnosticQuestionDto.Option> oDto = byQ.getOrDefault(qid, List.of()).stream()
                            .map(o -> DiagnosticQuestionDto.Option.builder()
                                    .id((String) o.get("id"))
                                    .text((String) o.get("text"))
                                    .build())
                            .collect(Collectors.toList());
                    dto.add(DiagnosticQuestionDto.builder()
                            .id(qid)
                            .prompt((String) q.get("prompt"))
                            .topic((String) q.get("topic"))
                            .difficulty((String) q.get("difficulty"))
                            .options(oDto)
                            .build());
                }
                return dto;
            });
        });
    }

    public Mono<Map<String, Object>> getStatus(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            return clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/usuarios")
                            .queryParam("select", "id,has_completed_diagnostic,diagnostic_level,diagnostic_completed_at")
                            .queryParam("id", "eq." + userId)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList()
                    .map(list -> list.isEmpty() ? Map.of("completed", false) : Map.of(
                            "completed", Boolean.TRUE.equals(list.get(0).get("has_completed_diagnostic")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(list.get(0).get("has_completed_diagnostic")))),
                            "level", list.get(0).get("diagnostic_level"),
                            "completedAt", list.get(0).get("diagnostic_completed_at")
                    ));
        });
    }

    public Mono<DiagnosticResultDto> submit(DiagnosticSubmitRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> {
            String userId = (String) user.get("id");
            if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
                return Mono.error(new RuntimeException("No hay respuestas"));
            }
            List<String> optionIds = request.getAnswers().stream().map(DiagnosticSubmitRequest.Answer::getOptionId).toList();
            String optIn = "in.(" + String.join(",", optionIds) + ")";

            Mono<List<Map>> selectedOptsMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_options")
                            .queryParam("select", "id,question_id,is_correct")
                            .queryParam("id", optIn)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            Set<String> qIds = new HashSet<>(request.getAnswers().stream().map(DiagnosticSubmitRequest.Answer::getQuestionId).toList());
            String qIn = "in.(" + String.join(",", qIds) + ")";
            Mono<List<Map>> questionsMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_questions")
                            .queryParam("select", "id,topic")
                            .queryParam("id", qIn)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return Mono.zip(selectedOptsMono, questionsMono).flatMap(tuple -> {
                List<Map> selected = tuple.getT1();
                Map<String, Map> optById = selected.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> m));
                Map<String, String> qTopic = tuple.getT2().stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));

                int total = request.getAnswers().size();
                int correct = 0;
                Map<String, Integer> topicCorrect = new HashMap<>();

                for (DiagnosticSubmitRequest.Answer ans : request.getAnswers()) {
                    Map o = optById.get(ans.getOptionId());
                    boolean isCorrect = o != null && Boolean.TRUE.equals(o.get("is_correct"));
                    if (isCorrect) {
                        correct++;
                        String topic = qTopic.get(ans.getQuestionId());
                        if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                    }
                }
                double score = total == 0 ? 0.0 : (correct * 100.0 / total);
                String level = score >= 80 ? "Advanced" : score >= 50 ? "Intermediate" : "Beginner";
                Instant now = Instant.now();

                Map<String, Object> attemptBody = Map.of(
                        "user_id", userId,
                        "started_at", now.toString(),
                        "completed_at", now.toString(),
                        "score_percent", score,
                        "level", level
                );

                Mono<Map> attemptInsert = clients.getDbAdmin().post()
                        .uri("/diagnostic_attempts")
                        .header("Prefer", "return=representation")
                        .bodyValue(attemptBody)
                        .retrieve()
                        .bodyToMono(List.class)
                        .map(list -> (Map) list.get(0));

                final String userIdFinal = userId;
                final double scoreFinal = score;
                final String levelFinal = level;
                final Instant nowFinal = now;
                final int correctFinal = correct;
                final int totalFinal = total;
                final Map<String, Integer> topicCorrectFinal = topicCorrect;

                return attemptInsert.flatMap(attempt -> {
                    String attemptId = (String) attempt.get("id");
                    List<Map<String, Object>> answersRows = new ArrayList<>();
                    for (DiagnosticSubmitRequest.Answer ans : request.getAnswers()) {
                        Map o = optById.get(ans.getOptionId());
                        boolean isCorrect = o != null && Boolean.TRUE.equals(o.get("is_correct"));
                        answersRows.add(Map.of(
                                "attempt_id", attemptId,
                                "question_id", ans.getQuestionId(),
                                "selected_option_id", ans.getOptionId(),
                                "is_correct", isCorrect
                        ));
                    }

                    Mono<String> insertAnswers = clients.getDbAdmin().post()
                            .uri("/diagnostic_answers")
                            .header("Prefer", "return=minimal")
                            .bodyValue(answersRows)
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    Mono<String> updateUser = clients.getDbAdmin().patch()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/usuarios")
                                    .queryParam("id", "eq." + userIdFinal)
                                    .build())
                            .header("Prefer", "return=minimal")
                            .bodyValue(Map.of(
                                    "has_completed_diagnostic", true,
                                    "diagnostic_level", levelFinal,
                                    "diagnostic_completed_at", nowFinal.toString()
                            ))
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("attemptId", attemptId);
                    metadata.put("score", scoreFinal);
                    metadata.put("level", levelFinal);
                    metadata.put("totalQuestions", totalFinal);
                    metadata.put("correct", correctFinal);

                    Mono<AwardResultDto> record = progressService
                            .recordActivityForUserId(userIdFinal, "DIAGNOSTIC_COMPLETED", metadata)
                            .onErrorResume(ex -> Mono.just(AwardResultDto.builder().awarded(List.of()).build()));

                    return Mono.when(insertAnswers, updateUser, record).thenReturn(
                            DiagnosticResultDto.builder()
                                    .userId(userIdFinal)
                                    .scorePercent(scoreFinal)
                                    .level(levelFinal)
                                    .recommendedTopics(recommendTopics(topicCorrectFinal))
                                    .topicBreakdown(topicCorrectFinal)
                                    .totalCorrect(correctFinal)
                                    .totalQuestions(totalFinal)
                                    .completedAt(nowFinal)
                                    .build()
                    );
                });
            });
        });
    }

    public Mono<DiagnosticResultDto> getLastResult(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<List<Map>> attemptMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_attempts")
                            .queryParam("select", "id,user_id,completed_at,score_percent,level")
                            .queryParam("user_id", "eq." + userId)
                            .queryParam("order", "completed_at.desc")
                            .queryParam("limit", "1")
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return attemptMono.flatMap(list -> {
                if (list.isEmpty()) return Mono.error(new RuntimeException("Sin intentos"));
                Map attempt = list.get(0);
                String attemptId = (String) attempt.get("id");

                Mono<List<Map>> answersMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/diagnostic_answers")
                                .queryParam("select", "question_id,is_correct")
                                .queryParam("attempt_id", "eq." + attemptId)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                return answersMono.flatMap(ansList -> {
                    Set<String> qIds = ansList.stream().map(m -> (String) m.get("question_id")).collect(Collectors.toSet());
                    if (qIds.isEmpty()) {
                        return Mono.just(DiagnosticResultDto.builder()
                                .userId(userId)
                                .scorePercent(((Number) attempt.get("score_percent")).doubleValue())
                                .level((String) attempt.get("level"))
                                .recommendedTopics(List.of())
                                .topicBreakdown(Map.of())
                                .totalCorrect(0)
                                .totalQuestions(0)
                                .completedAt(Instant.parse((String) attempt.get("completed_at")))
                                .build());
                    }
                    String qIn = "in.(" + String.join(",", qIds) + ")";
                    Mono<List<Map>> qMono = clients.getDbAdmin().get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/diagnostic_questions")
                                    .queryParam("select", "id,topic")
                                    .queryParam("id", qIn)
                                    .build())
                            .retrieve()
                            .bodyToFlux(Map.class)
                            .collectList();

                    return qMono.map(qList -> {
                        Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                        Map<String, Integer> topicCorrect = new HashMap<>();
                        int correct = 0;
                        for (Map a : ansList) {
                            boolean isC = Boolean.TRUE.equals(a.get("is_correct"));
                            if (isC) {
                                correct++;
                                String topic = qTopic.get((String) a.get("question_id"));
                                if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                            }
                        }
                        int total = ansList.size();
                        double score = ((Number) attempt.get("score_percent")).doubleValue();
                        return DiagnosticResultDto.builder()
                                .userId(userId)
                                .scorePercent(score)
                                .level((String) attempt.get("level"))
                                .recommendedTopics(recommendTopics(topicCorrect))
                                .topicBreakdown(topicCorrect)
                                .totalCorrect(correct)
                                .totalQuestions(total)
                                .completedAt(Instant.parse((String) attempt.get("completed_at")))
                                .build();
                    });
                });
            });
        });
    }

    private Mono<Map> getUserFromToken(String accessToken) {
        return clients.buildUserAuthClient(accessToken).get().uri("/user").retrieve().bodyToMono(Map.class);
    }

    private List<String> recommendTopics(Map<String, Integer> topicCorrect) {
        if (topicCorrect == null || topicCorrect.isEmpty()) return List.of();
        int min = topicCorrect.values().stream().min(Integer::compare).orElse(0);
        return topicCorrect.entrySet().stream()
                .filter(e -> e.getValue() == min)
                .map(Map.Entry::getKey)
                .limit(3)
                .collect(Collectors.toList());
    }
}
