package com.example.social.auth.app.controller;

import com.example.social.auth.api.AuthApi;
import com.example.social.auth.api.model.LoginRequest;
import com.example.social.auth.api.model.RegisterUserRequest;
import com.example.social.auth.app.service.AuthService;
import com.example.social.shared.domain.AuthTokenResponse;
import com.example.social.shared.domain.AuthenticatedUserResponse;
import com.example.social.shared.domain.UserProfileResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController implements AuthApi {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @Override
  public UserProfileResponse register(RegisterUserRequest request) {
    return authService.register(request);
  }

  @Override
  public AuthTokenResponse login(LoginRequest request) {
    return authService.login(request);
  }

  @Override
  public AuthenticatedUserResponse me(Authentication authentication) {
    return authService.me(authentication);
  }
}
