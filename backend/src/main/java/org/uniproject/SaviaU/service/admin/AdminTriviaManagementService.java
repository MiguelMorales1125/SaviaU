package org.uniproject.SaviaU.service.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.uniproject.SaviaU.config.SupabaseClients;
import org.uniproject.SaviaU.dto.TriviaSetDto;
import org.uniproject.SaviaU.dto.admin.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTriviaManagementService {

    private final SupabaseClients clients;
    private final AdminAuthService adminAuthService;

    public Mono<List<TriviaSetDto>> listSets(String accessToken) {
	return adminAuthService.requireAdmin(accessToken)
		.then(clients.getDbAdmin().get()
			.uri(uriBuilder -> uriBuilder
				.path("/trivia_sets")
				.queryParam("select", "id,title,description,topic,is_active")
				.queryParam("order", "title.asc")
				.build())
			.retrieve()
			.bodyToFlux(Map.class)
			.collectList()
			.map(list -> list.stream().map(m -> TriviaSetDto.builder()
				.id((String) m.get("id"))
				.title((String) m.get("title"))
				.description((String) m.get("description"))
				.topic((String) m.get("topic"))
				.active(m.get("is_active") == null ? null : Boolean.valueOf(String.valueOf(m.get("is_active"))))
				.build()).collect(Collectors.toList())));
    }

    public Mono<TriviaSetDto> upsertSet(String accessToken, AdminTriviaSetUpsertRequest request) {
	return adminAuthService.requireAdmin(accessToken)
		.then(Mono.defer(() -> {
		    log.info("🔧 upsertSet - Request: id={}, title={}, active={}", 
			    request.getId(), request.getTitle(), request.getActive());
		    
		    Map<String, Object> body = new HashMap<>();
		    body.put("title", request.getTitle());
		    body.put("description", request.getDescription());
		    body.put("topic", request.getTopic());
		    // Asegurar que is_active siempre tenga un valor booleano válido
		    body.put("is_active", request.getActive() != null ? request.getActive() : true);
		    log.info("🔧 upsertSet - Body to send: {}", body);
		    
		    // Si hay ID, es una actualización (PATCH), si no hay ID es creación (POST)
		    if (request.getId() != null && !request.getId().isEmpty()) {
			// Actualización
			return clients.getDbAdmin().patch()
				.uri(uriBuilder -> uriBuilder
					.path("/trivia_sets")
					.queryParam("id", "eq." + request.getId())
					.build())
				.header("Prefer", "return=representation")
				.bodyValue(body)
				.retrieve()
				.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
				.doOnError(error -> {
				    log.error("❌ upsertSet (UPDATE) - Error from Supabase: {}", error.getMessage(), error);
				})
				.map(rows -> {
				    log.info("✅ upsertSet (UPDATE) - Response from Supabase: {}", rows);
				    return rows.get(0);
				})
				.map(row -> TriviaSetDto.builder()
					.id((String) row.get("id"))
					.title((String) row.get("title"))
					.description((String) row.get("description"))
					.topic((String) row.get("topic"))
					.active(row.get("is_active") == null ? null : Boolean.valueOf(String.valueOf(row.get("is_active"))))
					.build());
		    } else {
			// Creación
			return clients.getDbAdmin().post()
				.uri(uriBuilder -> uriBuilder
					.path("/trivia_sets")
					.build())
				.header("Prefer", "return=representation")
				.bodyValue(body)
				.retrieve()
				.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
				.doOnError(error -> {
				    log.error("❌ upsertSet (CREATE) - Error from Supabase: {}", error.getMessage(), error);
				})
				.map(rows -> {
				    log.info("✅ upsertSet (CREATE) - Response from Supabase: {}", rows);
				    return rows.get(0);
				})
				.map(row -> TriviaSetDto.builder()
					.id((String) row.get("id"))
					.title((String) row.get("title"))
					.description((String) row.get("description"))
					.topic((String) row.get("topic"))
					.active(row.get("is_active") == null ? null : Boolean.valueOf(String.valueOf(row.get("is_active"))))
					.build());
		    }
		}));
    }

    public Mono<List<AdminTriviaQuestionDto>> listQuestions(String accessToken, String setId) {
	return adminAuthService.requireAdmin(accessToken)
		.then(fetchQuestionsInternal(setId));
    }

    public Mono<AdminTriviaQuestionDto> createQuestion(String accessToken, AdminTriviaQuestionUpsertRequest request) {
	return adminAuthService.requireAdmin(accessToken)
		.then(upsertQuestionInternal(request, true));
    }

    public Mono<AdminTriviaQuestionDto> updateQuestion(String accessToken, String questionId, AdminTriviaQuestionUpsertRequest request) {
	request.setQuestionId(questionId);
	return adminAuthService.requireAdmin(accessToken)
		.then(upsertQuestionInternal(request, false));
    }

    public Mono<Void> deleteQuestion(String accessToken, String questionId) {
	return adminAuthService.requireAdmin(accessToken)
		.then(Mono.defer(() -> {
		    log.info("Eliminando pregunta {}", questionId);
		    
		    // Primero eliminar respuestas asociadas a esta pregunta
		    Mono<Void> deleteAnswers = clients.getDbAdmin().method(HttpMethod.DELETE)
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_answers")
				    .queryParam("question_id", "eq." + questionId)
				    .build())
			    .retrieve()
			    .bodyToMono(String.class)
			    .doOnSuccess(r -> log.info("Respuestas eliminadas para pregunta {}", questionId))
			    .then()
			    .onErrorResume(WebClientResponseException.class, ex -> {
				log.warn("Error eliminando respuestas (puede que no existan): {}", ex.getMessage());
				return Mono.empty();
			    });
		    
		    // Luego eliminar opciones
		    Mono<Void> deleteOptions = clients.getDbAdmin().method(HttpMethod.DELETE)
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_options")
				    .queryParam("question_id", "eq." + questionId)
				    .build())
			    .retrieve()
			    .bodyToMono(String.class)
			    .doOnSuccess(r -> log.info("Opciones eliminadas para pregunta {}", questionId))
			    .then()
			    .onErrorResume(WebClientResponseException.class, ex -> {
				log.error("Error eliminando opciones: Status: {}, Body: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
				return Mono.error(new RuntimeException("Error eliminando opciones de la pregunta: " + ex.getResponseBodyAsString()));
			    });

		    // Finalmente eliminar la pregunta
		    Mono<Void> deleteQuestion = clients.getDbAdmin().method(HttpMethod.DELETE)
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_questions")
				    .queryParam("id", "eq." + questionId)
				    .build())
			    .retrieve()
			    .bodyToMono(String.class)
			    .doOnSuccess(r -> log.info("Pregunta {} eliminada exitosamente", questionId))
			    .then()
			    .onErrorResume(WebClientResponseException.class, ex -> {
				log.error("Error eliminando pregunta: Status: {}, Body: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
				return Mono.error(new RuntimeException("Error eliminando la pregunta: " + ex.getResponseBodyAsString()));
			    });

		    return deleteAnswers.then(deleteOptions).then(deleteQuestion);
		}));
    }


    public Mono<List<AdminLeaderboardRowDto>> getLeaderboard(String accessToken, int limit) {
	int fetchLimit = Math.min(2000, Math.max(limit * 5, 200));
	return adminAuthService.requireAdmin(accessToken)
		.then(clients.getDbAdmin().get()
			.uri(uriBuilder -> uriBuilder
				.path("/trivia_attempts")
				.queryParam("select", "id,user_id,score_percent,completed_at")
				.queryParam("order", "completed_at.desc")
				.queryParam("limit", fetchLimit)
				.build())
			.retrieve()
			.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			.flatMap(rows -> {
			    Map<String, List<Map<String, Object>>> grouped = rows.stream()
				    .filter(row -> row.get("user_id") != null)
				    .collect(Collectors.groupingBy(row -> (String) row.get("user_id")));

			    List<Map<String, Object>> stats = grouped.entrySet().stream()
				    .map(entry -> {
					List<Map<String, Object>> attempts = entry.getValue();
					double avg = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).average().orElse(0);
					double best = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).max().orElse(0);
					Map<String, Object> stat = new HashMap<>();
					stat.put("user_id", entry.getKey());
					stat.put("avg_score", avg);
					stat.put("best_score", best);
					stat.put("attempts", attempts.size());
					return stat;
				    })
				    .sorted(Comparator
					    .comparingDouble((Map<String, Object> m) -> (double) m.get("avg_score")).reversed()
					    .thenComparingDouble(m -> (double) m.get("best_score")).reversed())
				    .limit(limit)
				    .collect(Collectors.toList());

			    return enrichWithProfiles(stats)
				    .map(profileMap -> stats.stream()
					    .map(stat -> {
						String userId = (String) stat.get("user_id");
						Map<String, Object> profile = profileMap.getOrDefault(userId, Collections.emptyMap());
						return AdminLeaderboardRowDto.builder()
							.userId(userId)
							.email((String) profile.get("email"))
							.fullName((String) profile.get("full_name"))
							.avgScore((double) stat.get("avg_score"))
							.bestScore((double) stat.get("best_score"))
							.attempts(((Number) stat.get("attempts")).intValue())
							.build();
					    })
					    .collect(Collectors.toList()));
			}));
    }

    public Mono<AdminUserProgressDto> getUserProgress(String accessToken, String targetUserId) {
	return adminAuthService.requireAdmin(accessToken)
		.then(fetchUserProgress(targetUserId));
    }

    public Mono<List<AdminUserProgressDto>> getCohortProgress(String accessToken, int limit) {
	int fetchLimit = Math.min(2000, Math.max(limit * 5, 200));
	return adminAuthService.requireAdmin(accessToken)
		.then(clients.getDbAdmin().get()
			.uri(uriBuilder -> uriBuilder
				.path("/trivia_attempts")
				.queryParam("select", "id,user_id,score_percent,completed_at")
				.queryParam("order", "completed_at.desc")
				.queryParam("limit", fetchLimit)
				.build())
			.retrieve()
			.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			.flatMap(rows -> {
			    Map<String, List<Map<String, Object>>> grouped = rows.stream()
				    .filter(row -> row.get("user_id") != null)
				    .collect(Collectors.groupingBy(row -> (String) row.get("user_id")));

			    List<Map<String, Object>> stats = grouped.entrySet().stream()
				    .map(entry -> {
					List<Map<String, Object>> attempts = entry.getValue();
					double avg = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).average().orElse(0);
					double best = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).max().orElse(0);
					Instant last = attempts.stream()
					    .map(a -> (String) a.get("completed_at"))
					    .filter(Objects::nonNull)
					    .map(Instant::parse)
					    .max(Comparator.naturalOrder())
					    .orElse(null);
					Map<String, Object> stat = new HashMap<>();
					stat.put("user_id", entry.getKey());
					stat.put("avg_score", avg);
					stat.put("best_score", best);
					stat.put("attempts", attempts.size());
					stat.put("last_attempt_at", last);
					return stat;
				    })
				    .sorted(Comparator
					    .comparingInt((Map<String, Object> m) -> ((Number) m.get("attempts")).intValue()).reversed()
					    .thenComparingDouble(m -> (double) m.get("avg_score")).reversed())
				    .limit(limit)
				    .collect(Collectors.toList());

			    return enrichWithProfiles(stats)
				.flatMap(profileMap -> Flux.fromIterable(stats)
					.flatMap(stat -> fetchAccuracy((String) stat.get("user_id"))
						.map(acc -> buildProgressRow(stat, profileMap.getOrDefault((String) stat.get("user_id"), Collections.emptyMap()), acc)))
					.collectList());
			}));
    }

    private Mono<Map<String, Map<String, Object>>> enrichWithProfiles(List<Map<String, Object>> rows) {
	if (rows.isEmpty()) {
	    return Mono.just(Collections.<String, Map<String, Object>>emptyMap());
	}
	String inParam = rows.stream()
		.map(row -> (String) row.get("user_id"))
		.filter(Objects::nonNull)
		.distinct()
		.map(id -> "\"" + id + "\"")
		.collect(Collectors.joining(","));
	return clients.getDbAdmin().get()
		.uri(uriBuilder -> uriBuilder
			.path("/usuarios")
			.queryParam("select", "id,full_name,email")
			.queryParam("id", "in.(" + inParam + ")")
			.build())
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
		.map(list -> list.stream()
			.collect(Collectors.toMap(row -> (String) row.get("id"), row -> row)));
    }

    private Mono<AdminUserProgressDto> fetchUserProgress(String userId) {
	Mono<List<Map<String, Object>>> attemptsMono = clients.getDbAdmin().get()
		.uri(uriBuilder -> uriBuilder
			.path("/trivia_attempts")
			.queryParam("select", "id,score_percent,completed_at")
			.queryParam("user_id", "eq." + userId)
			.build())
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

	Mono<List<Map<String, Object>>> profileMono = clients.getDbAdmin().get()
		.uri(uriBuilder -> uriBuilder
			.path("/usuarios")
			.queryParam("select", "id,full_name,email")
			.queryParam("id", "eq." + userId)
			.build())
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

	return Mono.zip(attemptsMono, profileMono)
		.flatMap(tuple -> {
		    List<Map<String, Object>> attempts = tuple.getT1();
		    Map<String, Object> profile = tuple.getT2().isEmpty() ? Collections.emptyMap() : tuple.getT2().get(0);
		    if (attempts.isEmpty()) {
			return fetchAccuracy(userId).map(accuracy -> AdminUserProgressDto.builder()
				.userId(userId)
				.email((String) profile.get("email"))
				.fullName((String) profile.get("full_name"))
				.totalAttempts(0)
				.avgScore(0)
				.bestScore(0)
				.accuracy(accuracy)
				.lastAttemptAt(null)
				.build());
		    }
		    double avg = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).average().orElse(0);
		    double best = attempts.stream().mapToDouble(a -> toDouble(a.get("score_percent"))).max().orElse(0);
		    Instant last = attempts.stream()
			    .map(a -> (String) a.get("completed_at"))
			    .filter(Objects::nonNull)
			    .map(Instant::parse)
			    .max(Comparator.naturalOrder())
			    .orElse(null);
		    return fetchAccuracy(userId).map(accuracy -> AdminUserProgressDto.builder()
			    .userId(userId)
			    .email((String) profile.get("email"))
			    .fullName((String) profile.get("full_name"))
			    .totalAttempts(attempts.size())
			    .avgScore(avg)
			    .bestScore(best)
			    .accuracy(accuracy)
			    .lastAttemptAt(last)
			    .build());
		});
    }

    private Mono<Double> fetchAccuracy(String userId) {
	return clients.getDbAdmin().get()
		.uri(uriBuilder -> uriBuilder
			.path("/trivia_attempts")
			.queryParam("select", "id")
			.queryParam("user_id", "eq." + userId)
			.build())
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
		.flatMap(attempts -> {
		    if (attempts.isEmpty()) {
			return Mono.just(0.0);
		    }
		    String inParam = attempts.stream()
			    .map(a -> (String) a.get("id"))
			    .filter(Objects::nonNull)
			    .map(id -> "\"" + id + "\"")
			    .collect(Collectors.joining(","));
		    if (inParam.isBlank()) {
			return Mono.just(0.0);
		    }
		    return clients.getDbAdmin().get()
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_answers")
				    .queryParam("select", "is_correct")
				    .queryParam("attempt_id", "in.(" + inParam + ")")
				    .build())
			    .retrieve()
			    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			    .map(list -> {
				if (list.isEmpty()) return 0.0;
				long correct = list.stream()
					.filter(m -> Boolean.TRUE.equals(m.get("is_correct")))
					.count();
				return (double) correct / list.size();
			    });
		})
		.onErrorResume(ex -> Mono.just(0.0));
    }

	private AdminUserProgressDto buildProgressRow(Map<String, Object> statsRow, Map<String, Object> profile, Double accuracy) {
	String userId = (String) statsRow.get("user_id");
	Instant last = statsRow.get("last_attempt_at") instanceof Instant inst ? inst : null;
	return AdminUserProgressDto.builder()
		.userId(userId)
		.email((String) profile.get("email"))
		.fullName((String) profile.get("full_name"))
		.totalAttempts(((Number) statsRow.getOrDefault("attempts", 0)).intValue())
		.avgScore(toDouble(statsRow.get("avg_score")))
		.bestScore(toDouble(statsRow.get("best_score")))
		.accuracy(accuracy == null ? 0.0 : accuracy)
		.lastAttemptAt(last)
		.build();
    }

    private Mono<List<AdminTriviaQuestionDto>> fetchQuestionsInternal(String setId) {
	String setFilter = setId != null && !setId.isBlank() ? "eq." + setId : null;
	Mono<List<Map<String, Object>>> questionsMono = clients.getDbAdmin().get()
		.uri(uriBuilder -> {
		    var builder = uriBuilder.path("/trivia_questions")
			    .queryParam("select", "id,set_id,prompt,topic,difficulty,is_active")
			    .queryParam("order", "created_at.asc");
		    if (setFilter != null) builder.queryParam("set_id", setFilter);
		    return builder.build();
		})
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

	return questionsMono.flatMap(questions -> {
	    if (questions.isEmpty()) return Mono.just(List.of());
	    String inParam = questions.stream()
		    .map(q -> "\"" + q.get("id") + "\"")
		    .collect(Collectors.joining(","));
	    Mono<List<Map<String, Object>>> optionsMono = clients.getDbAdmin().get()
		    .uri(uriBuilder -> uriBuilder
			    .path("/trivia_options")
			    .queryParam("select", "id,question_id,text,is_correct,explanation")
			    .queryParam("question_id", "in.(" + inParam + ")")
			    .build())
		    .retrieve()
		    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

	    return optionsMono.map(options -> {
		Map<String, List<Map<String, Object>>> grouped = options.stream().collect(Collectors.groupingBy(m -> (String) m.get("question_id")));
		return questions.stream().map(q -> {
		    List<AdminTriviaOptionDto> optionDtos = grouped.getOrDefault(q.get("id"), List.of()).stream()
			    .map(opt -> AdminTriviaOptionDto.builder()
				    .id((String) opt.get("id"))
				    .questionId((String) opt.get("question_id"))
				    .text((String) opt.get("text"))
				    .correct(Boolean.TRUE.equals(opt.get("is_correct")))
				    .explanation((String) opt.get("explanation"))
				    .build())
			    .collect(Collectors.toList());
		    return AdminTriviaQuestionDto.builder()
			    .id((String) q.get("id"))
			    .setId((String) q.get("set_id"))
			    .prompt((String) q.get("prompt"))
			    .topic((String) q.get("topic"))
			    .difficulty((String) q.get("difficulty"))
			    .active(Boolean.TRUE.equals(q.get("is_active")))
			    .options(optionDtos)
			    .build();
		}).collect(Collectors.toList());
	    });
	});
    }

    private Mono<AdminTriviaQuestionDto> upsertQuestionInternal(AdminTriviaQuestionUpsertRequest request, boolean creating) {
	if (creating && (request.getSetId() == null || request.getSetId().isBlank())) {
	    return Mono.error(new RuntimeException("setId es obligatorio"));
	}
	Map<String, Object> body = new HashMap<>();
	if (request.getQuestionId() != null) body.put("id", request.getQuestionId());
	if (request.getSetId() != null) body.put("set_id", request.getSetId());
	body.put("prompt", request.getPrompt());
	body.put("topic", request.getTopic());
	body.put("difficulty", request.getDifficulty());
	if (request.getActive() != null) body.put("is_active", request.getActive());

	Mono<Map<String, Object>> questionMono = clients.getDbAdmin().post()
		.uri(uriBuilder -> uriBuilder
			.path("/trivia_questions")
			.queryParam("on_conflict", "id")
			.build())
		.header("Prefer", "return=representation,resolution=merge-duplicates")
		.bodyValue(body)
		.retrieve()
		.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
		.map(rows -> rows.get(0));

	return questionMono.flatMap(row -> {
	    String questionId = (String) row.get("id");
	    List<AdminTriviaQuestionUpsertRequest.OptionPayload> opts = Optional.ofNullable(request.getOptions()).orElse(List.of());
	    
	    log.info("Procesando opciones para pregunta {}. Creating: {}, Total opciones: {}", questionId, creating, opts.size());
	    
	    Mono<Void> saveOptionsMono;
	    if (opts.isEmpty()) {
		saveOptionsMono = Mono.empty();
	    } else {
		// Separar opciones nuevas (sin id) de existentes (con id)
		List<AdminTriviaQuestionUpsertRequest.OptionPayload> newOptions = opts.stream()
			.filter(opt -> opt.getId() == null || opt.getId().isBlank())
			.collect(Collectors.toList());
		List<AdminTriviaQuestionUpsertRequest.OptionPayload> existingOptions = opts.stream()
			.filter(opt -> opt.getId() != null && !opt.getId().isBlank())
			.collect(Collectors.toList());
		
		log.info("Opciones nuevas: {}, Opciones existentes: {}", newOptions.size(), existingOptions.size());
		
		// Primero, si es update, eliminar opciones que ya no están
		Mono<Void> deleteMono;
		if (!creating && !opts.isEmpty()) {
		    String keepIds = existingOptions.stream()
			    .map(AdminTriviaQuestionUpsertRequest.OptionPayload::getId)
			    .map(id -> "\"" + id + "\"")
			    .collect(Collectors.joining(","));
		    if (!keepIds.isBlank()) {
			deleteMono = clients.getDbAdmin().method(HttpMethod.DELETE)
				.uri(uriBuilder -> uriBuilder
					.path("/trivia_options")
					.queryParam("question_id", "eq." + questionId)
					.queryParam("id", "not.in.(" + keepIds + ")")
					.build())
				.retrieve()
				.bodyToMono(String.class)
				.then()
				.onErrorResume(WebClientResponseException.class, ex -> {
				    log.warn("Error eliminando opciones antiguas: {}", ex.getMessage());
				    return Mono.empty();
				});
		    } else {
			// Si no hay IDs existentes, eliminar todas las opciones viejas
			deleteMono = clients.getDbAdmin().method(HttpMethod.DELETE)
				.uri(uriBuilder -> uriBuilder
					.path("/trivia_options")
					.queryParam("question_id", "eq." + questionId)
					.build())
				.retrieve()
				.bodyToMono(String.class)
				.then()
				.onErrorResume(WebClientResponseException.class, ex -> {
				    log.warn("Error eliminando todas las opciones: {}", ex.getMessage());
				    return Mono.empty();
				});
		    }
		} else {
		    deleteMono = Mono.empty();
		}
		
		// Luego, actualizar opciones existentes
		Mono<Void> updateMono;
		if (!existingOptions.isEmpty()) {
		    List<Map<String, Object>> updateBodies = existingOptions.stream().map(opt -> {
			Map<String, Object> map = new HashMap<>();
			map.put("id", opt.getId());
			map.put("question_id", questionId);
			map.put("text", opt.getText());
			map.put("is_correct", opt.isCorrect());
			if (opt.getExplanation() != null && !opt.getExplanation().isBlank()) {
			    map.put("explanation", opt.getExplanation());
			}
			return map;
		    }).collect(Collectors.toList());
		    
		    log.info("Actualizando {} opciones existentes", updateBodies.size());
		    updateMono = clients.getDbAdmin().post()
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_options")
				    .queryParam("on_conflict", "id")
				    .build())
			    .header("Prefer", "return=representation,resolution=merge-duplicates")
			    .bodyValue(updateBodies)
			    .retrieve()
			    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			    .then()
			    .onErrorResume(WebClientResponseException.class, ex -> {
				log.error("Error actualizando opciones existentes. Status: {}, Body: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
				return Mono.error(new RuntimeException("Error actualizando opciones: " + ex.getResponseBodyAsString()));
			    });
		} else {
		    updateMono = Mono.empty();
		}
		
		// Finalmente, insertar opciones nuevas
		Mono<Void> insertMono;
		if (!newOptions.isEmpty()) {
		    List<Map<String, Object>> insertBodies = newOptions.stream().map(opt -> {
			Map<String, Object> map = new HashMap<>();
			map.put("question_id", questionId);
			map.put("text", opt.getText());
			map.put("is_correct", opt.isCorrect());
			if (opt.getExplanation() != null && !opt.getExplanation().isBlank()) {
			    map.put("explanation", opt.getExplanation());
			}
			return map;
		    }).collect(Collectors.toList());
		    
		    log.info("Insertando {} opciones nuevas", insertBodies.size());
		    insertMono = clients.getDbAdmin().post()
			    .uri(uriBuilder -> uriBuilder
				    .path("/trivia_options")
				    .build())
			    .header("Prefer", "return=representation")
			    .bodyValue(insertBodies)
			    .retrieve()
			    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			    .then()
			    .onErrorResume(WebClientResponseException.class, ex -> {
				log.error("Error insertando opciones nuevas. Status: {}, Body: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
				return Mono.error(new RuntimeException("Error insertando opciones: " + ex.getResponseBodyAsString()));
			    });
		} else {
		    insertMono = Mono.empty();
		}
		
		saveOptionsMono = deleteMono.then(updateMono).then(insertMono);
	    }

	    return saveOptionsMono.then(fetchQuestionsInternal(request.getSetId())
		    .map(list -> list.stream()
			    .filter(q -> questionId.equals(q.getId()))
			    .findFirst()
			    .orElseGet(() -> AdminTriviaQuestionDto.builder()
				    .id(questionId)
				    .setId((String) row.get("set_id"))
				    .prompt((String) row.get("prompt"))
				    .topic((String) row.get("topic"))
				    .difficulty((String) row.get("difficulty"))
				    .active(Boolean.TRUE.equals(row.get("is_active")))
				    .options(List.of())
				    .build())));
	});
    }

    public Mono<List<AdminTriviaHistoryDto>> getUserHistory(String token, String userId, int days) {
	return adminAuthService.requireAdmin(token)
		.flatMap(valid -> clients.getDbAdmin().get()
			.uri(uriBuilder -> uriBuilder
				.path("/trivia_attempts")
				.queryParam("select", "completed_at,score_percent")
				.queryParam("user_id", "eq." + userId)
				.queryParam("completed_at", "not.is.null")
				.queryParam("order", "completed_at.asc")
				.build())
			.retrieve()
			.bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
			.map(attempts -> {
			    if (attempts.isEmpty()) return List.of();
			    
			    // Agrupar por fecha
			    java.time.Instant cutoff = java.time.Instant.now().minus(days, java.time.temporal.ChronoUnit.DAYS);
			    Map<java.time.LocalDate, List<Double>> byDate = attempts.stream()
				    .filter(a -> {
					String completedStr = (String) a.get("completed_at");
					if (completedStr == null) return false;
					java.time.Instant completed = java.time.Instant.parse(completedStr);
					return completed.isAfter(cutoff);
				    })
				    .collect(java.util.stream.Collectors.groupingBy(
					    a -> java.time.Instant.parse((String) a.get("completed_at"))
						    .atZone(java.time.ZoneId.systemDefault())
						    .toLocalDate(),
					    java.util.stream.Collectors.mapping(
						    a -> toDouble(a.get("score_percent")),
						    java.util.stream.Collectors.toList()
					    )
				    ));
			    
			    return byDate.entrySet().stream()
				    .map(entry -> AdminTriviaHistoryDto.builder()
					    .date(entry.getKey())
					    .avgScore(entry.getValue().stream()
						    .mapToDouble(Double::doubleValue)
						    .average()
						    .orElse(0))
					    .attempts(entry.getValue().size())
					    .build())
				    .sorted(java.util.Comparator.comparing(AdminTriviaHistoryDto::getDate))
				    .collect(java.util.stream.Collectors.toList());
			}));
    }

    private double toDouble(Object value) {
	if (value == null) return 0;
	if (value instanceof Number n) return n.doubleValue();
	if (value instanceof String s) {
	    try { return Double.parseDouble(s); } catch (NumberFormatException ignored) { return 0; }
	}
	return 0;
    }
}
