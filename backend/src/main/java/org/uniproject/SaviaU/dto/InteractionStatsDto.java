package org.uniproject.SaviaU.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InteractionStatsDto {
    private int triviaCompleted;
    private int diagnosticsCompleted;
    private int newsRead;
}

