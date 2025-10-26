package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleFinishRequest {
    private String accessToken;
    private String refreshToken;
}

