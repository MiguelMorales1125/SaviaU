package org.uniproject.SaviaU.dto.admin;

import lombok.Data;

import java.util.List;

@Data
public class AdminTriviaQuestionUpsertRequest {
    private String setId;
    private String questionId; // optional for updates
    private String prompt;
    private String topic;
    private String difficulty;
    private Boolean active;
    private List<OptionPayload> options;

    @Data
    public static class OptionPayload {
        private String id;
        private String text;
        private boolean correct;
        private String explanation;
    }
}
