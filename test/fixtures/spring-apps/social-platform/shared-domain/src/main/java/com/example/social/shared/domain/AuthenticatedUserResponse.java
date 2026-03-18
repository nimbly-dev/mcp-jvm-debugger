package com.example.social.shared.domain;

import java.util.List;

public record AuthenticatedUserResponse(String username, String email, String displayName, List<String> roles) {}
