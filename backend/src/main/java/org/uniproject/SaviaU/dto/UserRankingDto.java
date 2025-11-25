package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserRankingDto {
    int rank;
    String userId;
    String fullName;
    String email;
    int totalQuizzes;
    double averageScore;
    double bestScore;
    double rankingScore;
}
