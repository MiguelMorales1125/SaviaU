package org.uniproject.SaviaU.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLoginResponse {
    private String adminToken; // JWT HS256 (role=admin)
    private String id;
    private String email;
    private String fullName;
}

