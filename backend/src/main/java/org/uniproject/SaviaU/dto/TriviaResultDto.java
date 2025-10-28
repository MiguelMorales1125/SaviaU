package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaResultDto {
    private String attemptId;
    private String userId;
    private String setId;
    private double scorePercent;
    private int totalCorrect;
    private int totalQuestions;
    private Instant completedAt;
    private Map<String, Integer> topicBreakdown;
    private List<String> recommendedTopics;
}

