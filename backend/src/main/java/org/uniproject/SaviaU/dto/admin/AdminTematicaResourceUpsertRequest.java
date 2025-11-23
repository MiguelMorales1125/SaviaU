package org.uniproject.SaviaU.dto.admin;

import lombok.Data;

import java.util.List;

@Data
public class AdminTematicaResourceUpsertRequest {
    private String id;
    private String areaId;
    private String title;
    private String shortDescription;
    private String detailDescription;
    private String imageUrl;
    private String format;
    private String estimatedTime;
    private String funFact;
    private String deepDive;
    private Boolean highlighted;
    private List<String> sources;
}
