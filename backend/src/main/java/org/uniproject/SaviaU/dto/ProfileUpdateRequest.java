package org.uniproject.SaviaU.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class ProfileUpdateRequest {
    @NotBlank(message = "accessToken es requerido")
    private String accessToken;

    @Size(min = 3, max = 30, message = "alias debe tener entre 3 y 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_.-]+$", message = "alias solo permite letras, números, puntos, guiones y guion bajo")
    private String alias;

    @Size(max = 100, message = "carrera no debe exceder 100 caracteres")
    private String carrera;

    @Min(value = 1, message = "semestre debe ser >= 1")
    @Max(value = 20, message = "semestre debe ser <= 20")
    private Integer semestre;

    // Intereses ambientales
    private List<@Size(min = 1, max = 30, message = "cada interés debe tener entre 1 y 30 caracteres") String> intereses;

    // Si el usuario selecciona un avatar predefinido
    @Size(max = 100, message = "avatarKey demasiado largo")
    private String avatarKey;
}

