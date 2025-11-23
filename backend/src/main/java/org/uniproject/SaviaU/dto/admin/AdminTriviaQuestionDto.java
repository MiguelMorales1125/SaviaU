package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class AdminTriviaQuestionDto {
    String id;
    String setId;
    String prompt;
    String topic;
    String difficulty;
    boolean active;
    @Singular
    List<AdminTriviaOptionDto> options;
}
