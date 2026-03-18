package com.example.social.user.app.service;

import com.example.social.shared.domain.UserProfileResponse;
import com.example.social.user.api.model.UpdateUserRequest;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {
  private final Map<String, FixtureUser> users = new ConcurrentHashMap<>();
  private final Map<String, Set<String>> followersByUser = new ConcurrentHashMap<>();

  public UserService() {
    save(new FixtureUser("alice", "Alice Fixture", "Coffee, cameras, and clean APIs.", 12));
    save(new FixtureUser("bob", "Bob Fixture", "Runner, reader, builder.", 5));
    save(new FixtureUser("admin", "Admin Fixture", "Keeping the fixture in line.", 1));
  }

  public UserProfileResponse getProfile(String username) {
    FixtureUser user = requireUser(username);
    int followersCount = followersByUser.getOrDefault(username, Set.of()).size();
    return new UserProfileResponse(user.username(), user.displayName(), user.bio(), followersCount, user.followingCount());
  }

  public UserProfileResponse updateProfile(String username, UpdateUserRequest request) {
    FixtureUser current = requireUser(username);
    FixtureUser updated = new FixtureUser(current.username(), request.displayName(), request.bio(), current.followingCount());
    users.put(username, updated);
    return getProfile(username);
  }

  public void follow(String username, String viewerUsername) {
    requireUser(username);
    followersByUser.computeIfAbsent(username, ignored -> ConcurrentHashMap.newKeySet()).add(viewerUsername);
  }

  public void unfollow(String username, String viewerUsername) {
    requireUser(username);
    followersByUser.computeIfAbsent(username, ignored -> ConcurrentHashMap.newKeySet()).remove(viewerUsername);
  }

  private void save(FixtureUser user) {
    users.put(user.username(), user);
  }

  private FixtureUser requireUser(String username) {
    FixtureUser user = users.get(username);
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + username);
    }
    return user;
  }

  private record FixtureUser(String username, String displayName, String bio, int followingCount) {}
}
