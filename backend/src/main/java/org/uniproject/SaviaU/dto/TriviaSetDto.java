package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaSetDto {
    private String id; // UUID en texto
    private String title;
    private String description;
    private String topic;
    private Integer questionCount; // opcional, si se calcula
}

