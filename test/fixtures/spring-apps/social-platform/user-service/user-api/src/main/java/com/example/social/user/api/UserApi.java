package com.example.social.user.api;

import com.example.social.shared.domain.UserProfileResponse;
import com.example.social.user.api.model.UpdateUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import io.swagger.v3.oas.annotations.Operation;

@RequestMapping("/api/v1/users")
public interface UserApi {
  @GetMapping("/{username}")
  @Operation(summary = "View a public user profile")
  UserProfileResponse getUserProfile(@PathVariable String username);

  @PutMapping("/{username}")
  @PreAuthorize("hasRole('ADMIN') or #username == authentication.name")
  @Operation(summary = "Update a user profile")
  UserProfileResponse updateUserProfile(
      @PathVariable String username,
      @Valid @RequestBody UpdateUserRequest request,
      Authentication authentication);

  @PostMapping("/{username}/follow")
  @PreAuthorize("isAuthenticated()")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Follow another user")
  void followUser(@PathVariable String username, Authentication authentication);

  @DeleteMapping("/{username}/follow")
  @PreAuthorize("isAuthenticated()")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Unfollow another user")
  void unfollowUser(@PathVariable String username, Authentication authentication);
}
