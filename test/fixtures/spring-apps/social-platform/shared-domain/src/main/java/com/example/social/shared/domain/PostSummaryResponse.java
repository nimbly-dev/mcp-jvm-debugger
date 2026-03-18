package com.example.social.shared.domain;

import com.fasterxml.jackson.annotation.JsonView;
import java.util.List;

public record PostSummaryResponse(
    @JsonView(JsonViews.Summary.class) Long id,
    @JsonView(JsonViews.Summary.class) String authorUsername,
    @JsonView(JsonViews.Summary.class) String contentPreview,
    @JsonView(JsonViews.Summary.class) PostVisibility visibility,
    @JsonView(JsonViews.Summary.class) List<String> tags,
    @JsonView(JsonViews.Summary.class) int likeCount) {}
