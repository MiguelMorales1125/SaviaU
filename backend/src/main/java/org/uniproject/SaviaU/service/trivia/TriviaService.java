package org.uniproject.SaviaU.service.trivia;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.*;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import org.uniproject.SaviaU.service.progress.ProgressService;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriviaService {

    private final SupabaseClients clients;
    private final ProgressService progressService;

    private Mono<Map> getUserFromToken(String accessToken) {
        return clients.buildUserAuthClient(accessToken)
                .get()
                .uri("/user")
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<List<TriviaSetDto>> getSets() {
        return clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trivia_sets")
                        .queryParam("select", "id,title,description,topic,is_active")
                        .queryParam("is_active", "eq.true")
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList()
                .map(list -> list.stream().map(m -> TriviaSetDto.builder()
                                .id((String) m.get("id"))
                                .title((String) m.get("title"))
                                .description((String) m.get("description"))
                                .topic((String) m.get("topic"))
                                .build())
                        .collect(Collectors.toList()));
    }

    public Mono<List<TriviaQuestionDto>> getQuestions(String setId) {
        Mono<List<Map>> qMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trivia_questions")
                        .queryParam("select", "id,set_id,prompt,topic,difficulty,is_active")
                        .queryParam("is_active", "eq.true")
                        .queryParam("set_id", "eq." + setId)
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
                            .path("/trivia_options")
                            .queryParam("select", "id,question_id,text")
                            .queryParam("question_id", inParam)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return oMono.map(opts -> {
                Map<String, List<Map>> byQ = opts.stream().collect(Collectors.groupingBy(m -> (String) m.get("question_id")));
                List<TriviaQuestionDto> dto = new ArrayList<>();
                for (Map q : qList) {
                    String qid = (String) q.get("id");
                    List<TriviaQuestionDto.Option> oDto = byQ.getOrDefault(qid, List.of()).stream()
                            .map(o -> TriviaQuestionDto.Option.builder()
                                    .id((String) o.get("id"))
                                    .text((String) o.get("text"))
                                    .build())
                            .collect(Collectors.toList());
                    dto.add(TriviaQuestionDto.builder()
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

    public Mono<TriviaStartResponse> start(TriviaStartRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> {
            String userId = (String) user.get("id");
            // Validar set existente y activo
            Mono<List<Map>> setMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_sets")
                            .queryParam("select", "id,is_active")
                            .queryParam("id", "eq." + request.getSetId())
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return setMono.flatMap(list -> {
                if (list.isEmpty() || !Boolean.TRUE.equals(list.get(0).get("is_active"))) {
                    return Mono.error(new RuntimeException("Trivia inactiva o inexistente"));
                }
                Instant now = Instant.now();
                Map<String, Object> body = Map.of(
                        "user_id", userId,
                        "set_id", request.getSetId(),
                        "started_at", now.toString()
                );
                return clients.getDbAdmin().post()
                        .uri("/trivia_attempts")
                        .header("Prefer", "return=representation")
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(List.class)
                        .map(l -> (Map) l.get(0))
                        .map(row -> TriviaStartResponse.builder()
                                .attemptId((String) row.get("id"))
                                .setId((String) row.get("set_id"))
                                .startedAt((String) row.get("started_at"))
                                .build());
            });
        });
    }

    public Mono<TriviaAnswerResponse> answer(TriviaAnswerRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> {
            String userId = (String) user.get("id");
            // Cargar intento
            Mono<List<Map>> attemptMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_attempts")
                            .queryParam("select", "id,user_id,set_id,completed_at")
                            .queryParam("id", "eq." + request.getAttemptId())
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            // Cargar opción seleccionada (para saber si es correcta y explicación) y su pregunta
            Mono<List<Map>> optMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_options")
                            .queryParam("select", "id,question_id,is_correct,explanation")
                            .queryParam("id", "eq." + request.getSelectedOptionId())
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            // Cargar pregunta para validar que pertenece al set del intento y obtener topic
            Mono<List<Map>> qMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_questions")
                            .queryParam("select", "id,set_id,topic")
                            .queryParam("id", "eq." + request.getQuestionId())
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return Mono.zip(attemptMono, optMono, qMono).flatMap(tuple -> {
                List<Map> attempts = tuple.getT1();
                List<Map> options = tuple.getT2();
                List<Map> questions = tuple.getT3();

                if (attempts.isEmpty()) return Mono.error(new RuntimeException("Intento no encontrado"));
                Map attempt = attempts.get(0);
                if (!Objects.equals(userId, attempt.get("user_id"))) return Mono.error(new RuntimeException("No autorizado"));
                if (attempt.get("completed_at") != null) return Mono.error(new RuntimeException("El intento ya fue finalizado"));
                if (options.isEmpty()) return Mono.error(new RuntimeException("Opción inválida"));
                if (questions.isEmpty()) return Mono.error(new RuntimeException("Pregunta inválida"));

                Map opt = options.get(0);
                Map q = questions.get(0);
                String setFromAttempt = (String) attempt.get("set_id");
                String setFromQuestion = (String) q.get("set_id");
                if (!Objects.equals(setFromAttempt, setFromQuestion)) {
                    return Mono.error(new RuntimeException("La pregunta no pertenece a esta trivia"));
                }

                // Extraer explicación si existe
                String explanation = opt.get("explanation") == null ? null : String.valueOf(opt.get("explanation"));

                // Buscar opción correcta para UI (y para determinar corrección de forma robusta)
                Mono<List<Map>> correctOptMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_options")
                                .queryParam("select", "id,is_correct")
                                .queryParam("question_id", "eq." + request.getQuestionId())
                                .queryParam("is_correct", "eq.true")
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                // Primero obtenemos la(s) opción(es) correcta(s), luego determinamos la corrección
                return correctOptMono.flatMap(corr -> {
                    String correctOptionId = corr.isEmpty() ? null : (String) corr.get(0).get("id");
                    // Determinar si la selección es correcta comparando ids (fallback más robusto)
                    boolean computedIsCorrect = Objects.equals(correctOptionId, request.getSelectedOptionId())
                            || Boolean.TRUE.equals(opt.get("is_correct"));

                    // Upsert respuesta con el valor determinado
                    Map<String, Object> answerRow = new HashMap<>();
                    answerRow.put("attempt_id", request.getAttemptId());
                    answerRow.put("question_id", request.getQuestionId());
                    answerRow.put("selected_option_id", request.getSelectedOptionId());
                    answerRow.put("is_correct", computedIsCorrect);

                    return clients.getDbAdmin().post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/trivia_answers")
                                    .queryParam("on_conflict", "attempt_id,question_id")
                                    .build())
                            .header("Prefer", "resolution=merge-duplicates,return=minimal")
                            .bodyValue(answerRow)
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""))
                            .map(u -> TriviaAnswerResponse.builder()
                                    .attemptId(request.getAttemptId())
                                    .questionId(request.getQuestionId())
                                    .selectedOptionId(request.getSelectedOptionId())
                                    .correct(computedIsCorrect)
                                    .explanation(explanation)
                                    .correctOptionId(correctOptionId)
                                    .build());
                });
            });
        });
    }

    public Mono<TriviaResultDto> finish(TriviaFinishRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<List<Map>> attemptMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_attempts")
                            .queryParam("select", "id,user_id,set_id,started_at,completed_at")
                            .queryParam("id", "eq." + request.getAttemptId())
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return attemptMono.flatMap(list -> {
                if (list.isEmpty()) return Mono.error(new RuntimeException("Intento no encontrado"));
                Map attempt = list.get(0);
                if (!Objects.equals(userId, attempt.get("user_id"))) return Mono.error(new RuntimeException("No autorizado"));
                String setId = (String) attempt.get("set_id");

                Mono<List<Map>> answersMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_answers")
                                .queryParam("select", "question_id,is_correct")
                                .queryParam("attempt_id", "eq." + request.getAttemptId())
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                Mono<List<Map>> questionsMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_questions")
                                .queryParam("select", "id,topic")
                                .queryParam("set_id", "eq." + setId)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                return Mono.zip(answersMono, questionsMono).flatMap(tuple -> {
                    List<Map> ans = tuple.getT1();
                    List<Map> qList = tuple.getT2();
                    Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                    int totalQuestions = qList.size();
                    int correct = 0;
                    Map<String, Integer> topicCorrect = new HashMap<>();
                    for (Map a : ans) {
                        boolean isC = Boolean.TRUE.equals(a.get("is_correct"));
                        if (isC) {
                            correct++;
                            String qid = (String) a.get("question_id");
                            String topic = qTopic.get(qid);
                            if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                        }
                    }
                    double score = totalQuestions == 0 ? 0.0 : (correct * 100.0 / totalQuestions);
                    Instant now = Instant.now();

                    Mono<String> updateAttempt = clients.getDbAdmin().patch()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/trivia_attempts")
                                    .queryParam("id", "eq." + request.getAttemptId())
                                    .build())
                            .header("Prefer", "return=minimal")
                            .bodyValue(Map.of(
                                    "completed_at", now.toString(),
                                    "score_percent", score
                            ))
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    TriviaResultDto result = TriviaResultDto.builder()
                            .attemptId((String) attempt.get("id"))
                            .userId(userId)
                            .setId(setId)
                            .scorePercent(score)
                            .totalCorrect(correct)
                            .totalQuestions(totalQuestions)
                            .completedAt(now)
                            .topicBreakdown(topicCorrect)
                            .recommendedTopics(recommendTopics(topicCorrect))
                            .build();

                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("attemptId", request.getAttemptId());
                    metadata.put("setId", setId);
                    metadata.put("score", score);
                    metadata.put("totalQuestions", totalQuestions);
                    metadata.put("correct", correct);

                    Mono<AwardResultDto> record = progressService
                            .recordActivityForUserId(userId, "TRIVIA_COMPLETED", metadata)
                            .onErrorResume(ex -> Mono.just(AwardResultDto.builder().awarded(List.of()).build()));

                    return updateAttempt.then(record).thenReturn(result);
                });
            });
        });
    }

    public Mono<TriviaResultDto> getResult(String accessToken, String attemptId) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<List<Map>> attemptMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_attempts")
                            .queryParam("select", "id,user_id,set_id,completed_at,score_percent")
                            .queryParam("id", "eq." + attemptId)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return attemptMono.flatMap(list -> {
                if (list.isEmpty()) return Mono.error(new RuntimeException("Intento no encontrado"));
                Map attempt = list.get(0);
                if (!Objects.equals(userId, attempt.get("user_id"))) return Mono.error(new RuntimeException("No autorizado"));
                String setId = (String) attempt.get("set_id");

                Mono<List<Map>> ansMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_answers")
                                .queryParam("select", "question_id,is_correct")
                                .queryParam("attempt_id", "eq." + attemptId)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();
                Mono<List<Map>> qMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_questions")
                                .queryParam("select", "id,topic")
                                .queryParam("set_id", "eq." + setId)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                return Mono.zip(ansMono, qMono).map(tuple -> {
                    List<Map> ans = tuple.getT1();
                    List<Map> qList = tuple.getT2();
                    Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                    int totalQuestions = qList.size();
                    int correct = 0;
                    Map<String, Integer> topicCorrect = new HashMap<>();
                    for (Map a : ans) {
                        boolean isC = Boolean.TRUE.equals(a.get("is_correct"));
                        if (isC) {
                            correct++;
                            String topic = qTopic.get((String) a.get("question_id"));
                            if (topic != null) topicCorrect.put(topic, topicCorrect.getOrDefault(topic, 0) + 1);
                        }
                    }
                    double score = totalQuestions == 0 ? 0.0 : (correct * 100.0 / totalQuestions);
                    Instant completedAt = attempt.get("completed_at") == null ? null : Instant.parse((String) attempt.get("completed_at"));
                    return TriviaResultDto.builder()
                            .attemptId((String) attempt.get("id"))
                            .userId(userId)
                            .setId(setId)
                            .scorePercent(attempt.get("score_percent") == null ? score : ((Number) attempt.get("score_percent")).doubleValue())
                            .totalCorrect(correct)
                            .totalQuestions(totalQuestions)
                            .completedAt(completedAt)
                            .topicBreakdown(topicCorrect)
                            .recommendedTopics(recommendTopics(topicCorrect))
                            .build();
                });
            });
        });
    }

    public Mono<TriviaStatsDto> getStats(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<List<Map>> attemptsMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_attempts")
                            .queryParam("select", "id,user_id,completed_at,score_percent")
                            .queryParam("user_id", "eq." + userId)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();

            return attemptsMono.flatMap(attempts -> {
                int totalAttempts = attempts.size();
                double avg = attempts.stream()
                        .map(m -> (Number) m.getOrDefault("score_percent", 0))
                        .mapToDouble(Number::doubleValue)
                        .average().orElse(0.0);
                double best = attempts.stream()
                        .map(m -> (Number) m.getOrDefault("score_percent", 0))
                        .mapToDouble(Number::doubleValue)
                        .max().orElse(0.0);
                Instant lastAt = attempts.stream()
                        .map(m -> (String) m.get("completed_at"))
                        .filter(Objects::nonNull)
                        .map(Instant::parse)
                        .max(Comparator.naturalOrder())
                        .orElse(null);

                // Cargar respuestas de todos los intentos del usuario
                if (attempts.isEmpty()) {
                    return Mono.just(TriviaStatsDto.builder()
                            .userId(userId)
                            .totalAttempts(0)
                            .avgScore(0.0)
                            .bestScore(0.0)
                            .lastAttemptAt(null)
                            .totalQuestionsAnswered(0)
                            .totalCorrect(0)
                            .build());
                }
                String inAttempts = "in.(" + attempts.stream().map(m -> (String) m.get("id")).collect(Collectors.joining(",")) + ")";
                Mono<List<Map>> ansMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_answers")
                                .queryParam("select", "is_correct,attempt_id")
                                .queryParam("attempt_id", inAttempts)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();

                return ansMono.map(ans -> {
                    int totalAns = ans.size();
                    int totalCorrect = (int) ans.stream().filter(a -> Boolean.TRUE.equals(a.get("is_correct"))).count();
                    return TriviaStatsDto.builder()
                            .userId(userId)
                            .totalAttempts(totalAttempts)
                            .avgScore(avg)
                            .bestScore(best)
                            .lastAttemptAt(lastAt)
                            .totalQuestionsAnswered(totalAns)
                            .totalCorrect(totalCorrect)
                            .build();
                });
            });
        });
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
