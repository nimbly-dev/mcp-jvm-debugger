package com.example.social.post.api;

import com.example.social.shared.domain.PageResponse;
import com.example.social.shared.domain.PostSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/api/v1")
public interface FeedApi {
  @GetMapping("/feed")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "View the authenticated user's feed")
  PageResponse<PostSummaryResponse> getFeed(
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "10") Integer size,
      Authentication authentication);
}
