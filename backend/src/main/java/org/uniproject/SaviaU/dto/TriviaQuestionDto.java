package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaQuestionDto {
    private String id;
    private String prompt;
    private String topic;
    private String difficulty;
    private List<Option> options;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Option {
        private String id;
        private String text;
    }
}

