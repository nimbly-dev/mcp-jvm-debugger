package com.example.social.shared.domain;

import java.util.List;

public record PageResponse<T>(List<T> content, int page, int size, long totalElements) {}
