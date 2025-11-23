package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class AdminUserProgressDto {
    String userId;
    String email;
    String fullName;
    int totalAttempts;
    double avgScore;
    double bestScore;
    double accuracy;
    Instant lastAttemptAt;
}
