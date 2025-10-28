package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaStatsDto {
    private String userId;
    private int totalAttempts;
    private double avgScore;
    private double bestScore;
    private Instant lastAttemptAt;
    private int totalQuestionsAnswered;
    private int totalCorrect;
}

