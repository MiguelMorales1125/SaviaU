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
public class DiagnosticQuestionDto {
    private String id; // UUID en texto
    private String prompt;
    private String topic;
    private String difficulty; // opcional: low/medium/high o 1/2/3
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

