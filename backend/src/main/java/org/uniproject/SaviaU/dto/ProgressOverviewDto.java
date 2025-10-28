package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProgressOverviewDto {
    private InteractionStatsDto stats;
    private List<TopicProgressDto> topics;
    private List<BadgeDto> badges;
}

