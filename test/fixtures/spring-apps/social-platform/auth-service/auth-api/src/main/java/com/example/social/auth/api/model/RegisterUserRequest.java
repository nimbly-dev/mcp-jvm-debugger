package com.example.social.auth.api.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
    @NotBlank @Size(min = 3, max = 32) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 64) String password,
    @NotBlank @Size(min = 3, max = 64) String displayName) {}
