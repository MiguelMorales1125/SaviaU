package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticSubmitRequest {
    private String accessToken; // Supabase access_token para identificar al usuario
    private List<Answer> answers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Answer {
        private String questionId;
        private String optionId;
    }
}

