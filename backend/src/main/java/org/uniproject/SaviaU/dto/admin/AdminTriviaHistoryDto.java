package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class AdminTriviaHistoryDto {
    LocalDate date;
    double avgScore;
    int attempts;
}
