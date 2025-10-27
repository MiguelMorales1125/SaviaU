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
public class DiagnosticResultDto {
    private String userId;
    private Double scorePercent;
    private String level; // Beginner/Intermediate/Advanced
    private List<String> recommendedTopics;
    private Map<String, Integer> topicBreakdown; // topic -> correct count
    private Integer totalCorrect;
    private Integer totalQuestions;
    private Instant completedAt;
}

