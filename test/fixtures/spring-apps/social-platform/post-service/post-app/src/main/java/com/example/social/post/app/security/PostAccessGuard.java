package com.example.social.post.app.security;

import com.example.social.post.app.service.PostService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component("postAccessGuard")
public class PostAccessGuard {
  private final PostService postService;

  public PostAccessGuard(PostService postService) {
    this.postService = postService;
  }

  public boolean isOwnerOrAdmin(Long postId, Authentication authentication) {
    if (authentication == null) return false;
    for (GrantedAuthority authority : authentication.getAuthorities()) {
      if ("ROLE_ADMIN".equals(authority.getAuthority())) return true;
    }
    return postService.isOwner(postId, authentication.getName());
  }
}
