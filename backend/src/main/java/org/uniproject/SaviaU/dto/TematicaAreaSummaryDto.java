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
public class TematicaAreaSummaryDto {
    private String id;
    private String name;
    private String summary;
    private String accentColor;
    private String heroImage;
    private int resourceCount;
    private List<String> keywords;
}
