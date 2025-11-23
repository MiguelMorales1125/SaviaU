package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminLeaderboardRowDto {
    String userId;
    String email;
    String fullName;
    double avgScore;
    double bestScore;
    int attempts;
}
