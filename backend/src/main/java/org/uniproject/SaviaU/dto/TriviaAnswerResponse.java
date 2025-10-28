package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaAnswerResponse {
    private String attemptId;
    private String questionId;
    private String selectedOptionId;
    private boolean correct;
    private String explanation;
    private String correctOptionId;
}

