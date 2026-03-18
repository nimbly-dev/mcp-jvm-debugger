package com.example.social.shared.domain;

public record UserProfileResponse(
    String username,
    String displayName,
    String bio,
    int followersCount,
    int followingCount) {}
