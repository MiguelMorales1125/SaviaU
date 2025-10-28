package org.uniproject.SaviaU.dto;

import lombok.Data;

@Data
public class TriviaAnswerRequest {
    private String accessToken;
    private String attemptId;
    private String questionId;
    private String selectedOptionId;
}

