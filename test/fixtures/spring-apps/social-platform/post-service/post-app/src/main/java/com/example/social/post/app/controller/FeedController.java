package com.example.social.post.app.controller;

import com.example.social.post.api.FeedApi;
import com.example.social.post.app.service.PostService;
import com.example.social.shared.domain.PageResponse;
import com.example.social.shared.domain.PostSummaryResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FeedController implements FeedApi {
  private final PostService postService;

  public FeedController(PostService postService) {
    this.postService = postService;
  }

  @Override
  public PageResponse<PostSummaryResponse> getFeed(
      Integer page, Integer size, Authentication authentication) {
    return postService.getFeed(authentication.getName(), page, size);
  }
}
