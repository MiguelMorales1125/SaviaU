package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AwardResultDto {
    private List<BadgeDto> awarded;
}

