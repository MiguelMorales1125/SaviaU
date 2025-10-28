package org.uniproject.SaviaU.dto;

import lombok.Data;

@Data
public class TriviaFinishRequest {
    private String accessToken;
    private String attemptId;
}

