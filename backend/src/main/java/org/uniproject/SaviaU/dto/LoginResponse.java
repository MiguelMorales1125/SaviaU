package org.uniproject.SaviaU.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserInfo user;
    private String appToken;
    // Si el usuario pertenece a admin_users (activo), el backend incluirá un token especial de administrador
    private String adminToken;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private String id;
        private String email;
        private String role;
        private String createdAt;
        private String lastSignInAt;
        private Boolean diagnosticCompleted;
    }
}