package com.example.social.shared.domain;

import java.util.List;

public record AuthTokenResponse(String tokenType, String accessToken, String username, List<String> roles) {}
