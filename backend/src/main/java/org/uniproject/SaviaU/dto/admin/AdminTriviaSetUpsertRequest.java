package org.uniproject.SaviaU.dto.admin;

import lombok.Data;

@Data
public class AdminTriviaSetUpsertRequest {
    private String id;
    private String title;
    private String description;
    private String topic;
    private Boolean active;
}
