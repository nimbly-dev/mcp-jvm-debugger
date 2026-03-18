package com.example.social.shared.domain;

import com.fasterxml.jackson.annotation.JsonView;
import java.time.Instant;
import java.util.List;

public record PostDetailResponse(
    @JsonView(JsonViews.Detail.class) Long id,
    @JsonView(JsonViews.Detail.class) String authorUsername,
    @JsonView(JsonViews.Detail.class) String content,
    @JsonView(JsonViews.Detail.class) PostVisibility visibility,
    @JsonView(JsonViews.Detail.class) List<String> tags,
    @JsonView(JsonViews.Detail.class) int likeCount,
    @JsonView(JsonViews.Detail.class) Instant createdAt,
    @JsonView(JsonViews.Detail.class) Instant updatedAt) {}
