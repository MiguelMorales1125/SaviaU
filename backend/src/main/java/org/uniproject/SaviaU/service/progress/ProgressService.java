package org.uniproject.SaviaU.service.progress;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.*;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final SupabaseClients clients;

    private Mono<Map> getUserFromToken(String accessToken) {
        return clients.buildUserAuthClient(accessToken).get().uri("/user").retrieve().bodyToMono(Map.class);
    }

    public Mono<ProgressOverviewDto> getOverview(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> {
            String userId = (String) user.get("id");
            Mono<InteractionStatsDto> statsMono = getInteractionStats(userId);
            Mono<List<TopicProgressDto>> topicsMono = getTopicProgress(userId);
            Mono<List<BadgeDto>> badgesMono = getUserBadgesByUserId(userId);
            return Mono.zip(statsMono, topicsMono, badgesMono)
                    .map(t -> ProgressOverviewDto.builder()
                            .stats(t.getT1())
                            .topics(t.getT2())
                            .badges(t.getT3())
                            .build());
        });
    }

    public Mono<List<BadgeDto>> getUserBadges(String accessToken) {
        return getUserFromToken(accessToken).flatMap(user -> getUserBadgesByUserId((String) user.get("id")));
    }

    private Mono<List<BadgeDto>> getUserBadgesByUserId(String userId) {
        Mono<List<Map>> ubMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/user_badges")
                        .queryParam("select", "id,user_id,badge_id,awarded_at")
                        .queryParam("user_id", "eq." + userId)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        return ubMono.flatMap(list -> {
            if (list.isEmpty()) return Mono.just(List.of());
            List<String> badgeIds = list.stream().map(m -> (String) m.get("badge_id")).toList();
            String inBadges = "in.(" + String.join(",", badgeIds) + ")";
            Mono<List<Map>> bMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/badges")
                            .queryParam("select", "id,code,name,description,icon_url")
                            .queryParam("id", inBadges)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();
            Map<String, String> awardedAt = list.stream().collect(Collectors.toMap(m -> (String) m.get("badge_id"), m -> String.valueOf(m.get("awarded_at"))));
            return bMono.map(badges -> badges.stream().map(b -> BadgeDto.builder()
                            .id((String) b.get("id"))
                            .code((String) b.get("code"))
                            .name((String) b.get("name"))
                            .description((String) b.get("description"))
                            .iconUrl((String) b.get("icon_url"))
                            .awardedAt(awardedAt.get(b.get("id")) == null ? null : java.time.Instant.parse(awardedAt.get(b.get("id"))))
                            .build())
                    .collect(Collectors.toList()));
        });
    }

    public Mono<InteractionStatsDto> getInteractionStats(String userId) {
        Mono<Integer> triviaC = countActivities(userId, "TRIVIA_COMPLETED");
        Mono<Integer> diagC = countActivities(userId, "DIAGNOSTIC_COMPLETED");
        Mono<Integer> newsC = countActivities(userId, "NEWS_READ");
        return Mono.zip(triviaC, diagC, newsC)
                .map(t -> InteractionStatsDto.builder()
                        .triviaCompleted(t.getT1())
                        .diagnosticsCompleted(t.getT2())
                        .newsRead(t.getT3())
                        .build());
    }

    private Mono<Integer> countActivities(String userId, String type) {
        return clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/user_activities")
                        .queryParam("select", "id")
                        .queryParam("user_id", "eq." + userId)
                        .queryParam("type", "eq." + type)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList()
                .map(List::size);
    }

    public Mono<List<TopicProgressDto>> getTopicProgress(String userId) {
        // 1) Trivias
        Mono<List<Map>> attemptsMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/trivia_attempts")
                        .queryParam("select", "id")
                        .queryParam("user_id", "eq." + userId)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        Mono<Map<String, int[]>> triviaAgg = attemptsMono.flatMap(attempts -> {
            if (attempts.isEmpty()) return Mono.just(new HashMap<>());
            List<String> attemptIds = attempts.stream().map(m -> (String) m.get("id")).toList();
            String inAttempts = "in.(" + String.join(",", attemptIds) + ")";
            Mono<List<Map>> ansMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/trivia_answers")
                            .queryParam("select", "question_id,is_correct")
                            .queryParam("attempt_id", inAttempts)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();
            return ansMono.flatMap(ans -> {
                if (ans.isEmpty()) return Mono.just(new HashMap<>());
                Set<String> qIds = ans.stream().map(m -> (String) m.get("question_id")).collect(Collectors.toSet());
                String inQ = "in.(" + String.join(",", qIds) + ")";
                Mono<List<Map>> qMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/trivia_questions")
                                .queryParam("select", "id,topic")
                                .queryParam("id", inQ)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();
                return qMono.map(qList -> {
                    Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                    Map<String, int[]> agg = new HashMap<>(); // topic -> [answered, correct]
                    for (Map a : ans) {
                        String qid = (String) a.get("question_id");
                        String topic = qTopic.get(qid);
                        if (topic == null) continue;
                        agg.putIfAbsent(topic, new int[]{0, 0});
                        int[] v = agg.get(topic);
                        v[0] += 1;
                        if (Boolean.TRUE.equals(a.get("is_correct"))) v[1] += 1;
                    }
                    return agg;
                });
            });
        });

        // 2) Diagnósticos
        Mono<List<Map>> dAttemptsMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/diagnostic_attempts")
                        .queryParam("select", "id")
                        .queryParam("user_id", "eq." + userId)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        Mono<Map<String, int[]>> diagAgg = dAttemptsMono.flatMap(attempts -> {
            if (attempts.isEmpty()) return Mono.just(new HashMap<>());
            List<String> attemptIds = attempts.stream().map(m -> (String) m.get("id")).toList();
            String inAttempts = "in.(" + String.join(",", attemptIds) + ")";
            Mono<List<Map>> ansMono = clients.getDbAdmin().get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/diagnostic_answers")
                            .queryParam("select", "question_id,is_correct")
                            .queryParam("attempt_id", inAttempts)
                            .build())
                    .retrieve()
                    .bodyToFlux(Map.class)
                    .collectList();
            return ansMono.flatMap(ans -> {
                if (ans.isEmpty()) return Mono.just(new HashMap<>());
                Set<String> qIds = ans.stream().map(m -> (String) m.get("question_id")).collect(Collectors.toSet());
                String inQ = "in.(" + String.join(",", qIds) + ")";
                Mono<List<Map>> qMono = clients.getDbAdmin().get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/diagnostic_questions")
                                .queryParam("select", "id,topic")
                                .queryParam("id", inQ)
                                .build())
                        .retrieve()
                        .bodyToFlux(Map.class)
                        .collectList();
                return qMono.map(qList -> {
                    Map<String, String> qTopic = qList.stream().collect(Collectors.toMap(m -> (String) m.get("id"), m -> (String) m.get("topic")));
                    Map<String, int[]> agg = new HashMap<>();
                    for (Map a : ans) {
                        String qid = (String) a.get("question_id");
                        String topic = qTopic.get(qid);
                        if (topic == null) continue;
                        agg.putIfAbsent(topic, new int[]{0, 0});
                        int[] v = agg.get(topic);
                        v[0] += 1;
                        if (Boolean.TRUE.equals(a.get("is_correct"))) v[1] += 1;
                    }
                    return agg;
                });
            });
        });

        return Mono.zip(triviaAgg, diagAgg).map(t -> {
            Map<String, int[]> total = new HashMap<>(t.getT1());
            t.getT2().forEach((k, v) -> {
                total.putIfAbsent(k, new int[]{0, 0});
                total.get(k)[0] += v[0];
                total.get(k)[1] += v[1];
            });
            return total.entrySet().stream()
                    .map(e -> {
                        int answered = e.getValue()[0];
                        int correct = e.getValue()[1];
                        double percent = answered == 0 ? 0.0 : (correct * 100.0 / answered);
                        return TopicProgressDto.builder()
                                .topic(e.getKey())
                                .totalAnswered(answered)
                                .correct(correct)
                                .percent(percent)
                                .build();
                    })
                    .sorted(Comparator.comparing(TopicProgressDto::getTopic))
                    .collect(Collectors.toList());
        });
    }

    public Mono<AwardResultDto> recordActivity(RecordActivityRequest request) {
        return getUserFromToken(request.getAccessToken()).flatMap(user -> recordActivityForUserId((String) user.get("id"), request.getType(), request.getMetadata()));
    }

    public Mono<AwardResultDto> recordActivityForUserId(String userId, String type, Map<String, Object> metadata) {
        Map<String, Object> body = new HashMap<>();
        body.put("user_id", userId);
        body.put("type", type);
        if (metadata != null) body.put("metadata", metadata);
        Mono<String> insertAct = clients.getDbAdmin().post()
                .uri("/user_activities")
                .header("Prefer", "return=minimal")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

        return insertAct.then(awardBadgesIfAny(userId));
    }

    private Mono<AwardResultDto> awardBadgesIfAny(String userId) {
        // Cargar catálogo de insignias activas y las ya obtenidas por el usuario
        Mono<List<Map>> allBadgesMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/badges")
                        .queryParam("select", "id,code,name,description,icon_url,criteria_type,criteria_value,is_active")
                        .queryParam("is_active", "eq.true")
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();
        Mono<List<Map>> userBadgesMono = clients.getDbAdmin().get()
                .uri(uriBuilder -> uriBuilder
                        .path("/user_badges")
                        .queryParam("select", "badge_id")
                        .queryParam("user_id", "eq." + userId)
                        .build())
                .retrieve()
                .bodyToFlux(Map.class)
                .collectList();

        return Mono.zip(allBadgesMono, userBadgesMono, getInteractionStats(userId), getTopicProgress(userId))
                .flatMap(tuple -> {
                    List<Map> allBadges = tuple.getT1();
                    Set<String> owned = tuple.getT2().stream().map(m -> (String) m.get("badge_id")).collect(Collectors.toSet());
                    InteractionStatsDto stats = tuple.getT3();
                    List<TopicProgressDto> topics = tuple.getT4();

                    List<Map> toAward = new ArrayList<>();
                    for (Map b : allBadges) {
                        String id = (String) b.get("id");
                        if (owned.contains(id)) continue;
                        String type = (String) b.get("criteria_type");
                        Object value = b.get("criteria_value");
                        if ("TRIVIA_COMPLETED_COUNT".equals(type)) {
                            int needed = getJsonInt(value, "count", 1);
                            if (stats.getTriviaCompleted() >= needed) toAward.add(b);
                        } else if ("DIAGNOSTIC_COMPLETED".equals(type)) {
                            if (stats.getDiagnosticsCompleted() >= 1) toAward.add(b);
                        } else if ("NEWS_READ_COUNT".equals(type)) {
                            int needed = getJsonInt(value, "count", 5);
                            if (stats.getNewsRead() >= needed) toAward.add(b);
                        } else if ("TOPIC_MASTERY".equals(type)) {
                            String topic = getJsonString(value, "topic");
                            int thr = getJsonInt(value, "threshold", 80);
                            if (topic != null) {
                                Optional<TopicProgressDto> tp = topics.stream().filter(t -> topic.equalsIgnoreCase(t.getTopic())).findFirst();
                                if (tp.isPresent() && tp.get().getPercent() >= thr) toAward.add(b);
                            }
                        }
                    }

                    if (toAward.isEmpty()) return Mono.just(AwardResultDto.builder().awarded(List.of()).build());

                    // Insertar user_badges para cada insignia a otorgar
                    List<Map<String, Object>> rows = toAward.stream().map(b -> Map.of(
                            "user_id", userId,
                            "badge_id", b.get("id")
                    )).collect(Collectors.toList());

                    Mono<String> insert = clients.getDbAdmin().post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/user_badges")
                                    .queryParam("on_conflict", "user_id,badge_id")
                                    .build())
                            .header("Prefer", "return=minimal")
                            .bodyValue(rows)
                            .retrieve()
                            .bodyToMono(String.class)
                            .onErrorResume(WebClientResponseException.class, ex -> Mono.just(""));

                    List<BadgeDto> awarded = toAward.stream().map(b -> BadgeDto.builder()
                            .id((String) b.get("id"))
                            .code((String) b.get("code"))
                            .name((String) b.get("name"))
                            .description((String) b.get("description"))
                            .iconUrl((String) b.get("icon_url"))
                            .awardedAt(null)
                            .build()).collect(Collectors.toList());

                    return insert.thenReturn(AwardResultDto.builder().awarded(awarded).build());
                });
    }

    private int getJsonInt(Object json, String key, int def) {
        if (json instanceof Map) {
            Object v = ((Map<?, ?>) json).get(key);
            if (v instanceof Number) return ((Number) v).intValue();
            if (v != null) {
                try { return Integer.parseInt(String.valueOf(v)); } catch (Exception ignored) {}
            }
        }
        return def;
    }

    private String getJsonString(Object json, String key) {
        if (json instanceof Map) {
            Object v = ((Map<?, ?>) json).get(key);
            return v == null ? null : String.valueOf(v);
        }
        return null;
    }
}
