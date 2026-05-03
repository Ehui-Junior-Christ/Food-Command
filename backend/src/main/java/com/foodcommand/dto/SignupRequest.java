package com.foodcommand.dto;

import com.foodcommand.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    private String fullName;
    private String phone;
    private Role role;
}
