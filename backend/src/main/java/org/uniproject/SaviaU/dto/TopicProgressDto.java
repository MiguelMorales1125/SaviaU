package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopicProgressDto {
    private String topic;
    private int correct;
    private int totalAnswered;
    private double percent; // 0..100
}

