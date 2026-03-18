package com.example.social.post.api.model;

import com.example.social.shared.domain.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PostCreateRequest(
    @NotBlank @Size(min = 5, max = 280) String content,
    @NotNull PostVisibility visibility,
    List<@Size(min = 2, max = 24) String> tags) {}
