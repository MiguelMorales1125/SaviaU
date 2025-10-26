package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordApplyRequest {
    private String accessToken;
    private String newPassword;
}

