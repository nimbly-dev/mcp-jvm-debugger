package com.example.social.auth.app.service;

import com.example.social.auth.api.model.LoginRequest;
import com.example.social.auth.api.model.RegisterUserRequest;
import com.example.social.shared.domain.AuthTokenResponse;
import com.example.social.shared.domain.AuthenticatedUserResponse;
import com.example.social.shared.domain.UserProfileResponse;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final Map<String, FixtureUser> usersByUsername = new ConcurrentHashMap<>();
  private final Map<String, String> usernameByEmail = new ConcurrentHashMap<>();

  public AuthService() {
    seed("alice", "alice@example.com", "Passw0rd!", "Alice Fixture");
    seed("bob", "bob@example.com", "Passw0rd!", "Bob Fixture");
    seed("admin", "admin@example.com", "Passw0rd!", "Admin Fixture");
  }

  public UserProfileResponse register(RegisterUserRequest request) {
    if (usersByUsername.containsKey(request.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
    }
    seed(request.username(), request.email(), request.password(), request.displayName());
    return toProfile(usersByUsername.get(request.username()));
  }

  public AuthTokenResponse login(LoginRequest request) {
    String username = resolveUsername(request.usernameOrEmail());
    FixtureUser user = usersByUsername.get(username);
    if (user == null || !user.password().equals(request.password())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    String token = "admin".equals(username) ? "admin-token" : username + "-token";
    List<String> roles = "admin".equals(username) ? List.of("USER", "ADMIN") : List.of("USER");
    return new AuthTokenResponse("Bearer", token, username, roles);
  }

  public AuthenticatedUserResponse me(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    FixtureUser user = usersByUsername.get(authentication.getName());
    if (user == null) {
      return new AuthenticatedUserResponse(
          authentication.getName(), authentication.getName() + "@fixture.local", authentication.getName(), List.of("USER"));
    }
    List<String> roles =
        "admin".equals(user.username()) ? List.of("USER", "ADMIN") : List.of("USER");
    return new AuthenticatedUserResponse(user.username(), user.email(), user.displayName(), roles);
  }

  private void seed(String username, String email, String password, String displayName) {
    FixtureUser user = new FixtureUser(username, email, password, displayName, "Fixture bio for " + username);
    usersByUsername.put(username, user);
    usernameByEmail.put(email, username);
  }

  private String resolveUsername(String usernameOrEmail) {
    return usernameByEmail.getOrDefault(usernameOrEmail, usernameOrEmail);
  }

  private UserProfileResponse toProfile(FixtureUser user) {
    return new UserProfileResponse(user.username(), user.displayName(), user.bio(), 0, 0);
  }

  private record FixtureUser(String username, String email, String password, String displayName, String bio) {}
}
