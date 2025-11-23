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
public class TematicaAreaDto {
    private String id;
    private String name;
    private String summary;
    private String accentColor;
    private String heroImage;
    private String tagline;
    private List<String> learningFocus;
    private List<TematicaResourceDto> resources;
}
