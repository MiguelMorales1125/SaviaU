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
public class TematicaResourceDto {
    private String id;
    private String title;
    private String shortDescription;
    private String detailDescription;
    private String imageUrl;
    private String format;
    private String estimatedTime;
    private String funFact;
    private String deepDive;
    private List<String> sources;
}
