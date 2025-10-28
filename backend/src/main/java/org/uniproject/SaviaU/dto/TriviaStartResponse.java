package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaStartResponse {
    private String attemptId;
    private String setId;
    private String startedAt; // ISO-8601
}

