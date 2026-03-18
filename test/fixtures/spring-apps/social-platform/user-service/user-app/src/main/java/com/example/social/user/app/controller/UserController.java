package com.example.social.user.app.controller;

import com.example.social.shared.domain.UserProfileResponse;
import com.example.social.user.api.UserApi;
import com.example.social.user.api.model.UpdateUserRequest;
import com.example.social.user.app.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController implements UserApi {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @Override
  public UserProfileResponse getUserProfile(String username) {
    return userService.getProfile(username);
  }

  @Override
  public UserProfileResponse updateUserProfile(
      String username, UpdateUserRequest request, Authentication authentication) {
    return userService.updateProfile(username, request);
  }

  @Override
  public void followUser(String username, Authentication authentication) {
    userService.follow(username, authentication.getName());
  }

  @Override
  public void unfollowUser(String username, Authentication authentication) {
    userService.unfollow(username, authentication.getName());
  }
}
