package org.uniproject.SaviaU.dto;

import lombok.Data;

import java.util.Map;

@Data
public class RecordActivityRequest {
    private String accessToken;
    private String type; // e.g., NEWS_READ, TRIVIA_COMPLETED
    private Map<String, Object> metadata;
}

