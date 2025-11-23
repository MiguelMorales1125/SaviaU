package org.uniproject.SaviaU.dto.admin;

import lombok.Data;

import java.util.List;

@Data
public class AdminTematicaAreaUpsertRequest {
    private String id;
    private String name;
    private String summary;
    private String accentColor;
    private String heroImage;
    private String tagline;
    private Boolean published;
    private Integer sortOrder;
    private List<String> learningFocus;
}
