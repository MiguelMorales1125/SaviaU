package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminTriviaOptionDto {
    String id;
    String questionId;
    String text;
    boolean correct;
    String explanation;
}
