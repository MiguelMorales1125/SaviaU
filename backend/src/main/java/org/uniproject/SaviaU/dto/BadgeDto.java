package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class BadgeDto {
    private String id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    // Opcional: cuándo fue otorgada al usuario (puede ser null si es catálogo)
    private Instant awardedAt;
}

