package com.example.social.user.api.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @NotBlank @Size(min = 3, max = 64) String displayName,
    @NotBlank @Size(min = 8, max = 160) String bio) {}
