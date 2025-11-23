package org.uniproject.SaviaU.dto.admin;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class AdminUserDto {
    String id;
    String email;
    String fullName;
    boolean active;
    Instant lastLoginAt;
    String role;
}
