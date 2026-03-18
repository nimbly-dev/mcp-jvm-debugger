package com.example.social.auth.api;

import com.example.social.auth.api.model.LoginRequest;
import com.example.social.auth.api.model.RegisterUserRequest;
import com.example.social.shared.domain.AuthTokenResponse;
import com.example.social.shared.domain.AuthenticatedUserResponse;
import com.example.social.shared.domain.UserProfileResponse;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;

@RequestMapping("/api/v1/auth")
public interface AuthApi {
  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Register a new social platform user")
  UserProfileResponse register(@Valid @RequestBody RegisterUserRequest request);

  @PostMapping("/login")
  @Operation(summary = "Login with username or email and receive a bearer token")
  AuthTokenResponse login(@Valid @RequestBody LoginRequest request);

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "View the current authenticated user")
  AuthenticatedUserResponse me(@ParameterObject Authentication authentication);
}
