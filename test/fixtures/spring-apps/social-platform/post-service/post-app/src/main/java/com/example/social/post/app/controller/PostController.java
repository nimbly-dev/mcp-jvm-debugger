package com.example.social.post.app.controller;

import com.example.social.post.api.PostApi;
import com.example.social.post.api.model.PostCreateRequest;
import com.example.social.post.api.model.PostUpdateRequest;
import com.example.social.post.app.service.PostService;
import com.example.social.shared.domain.PageResponse;
import com.example.social.shared.domain.PostDetailResponse;
import com.example.social.shared.domain.PostSummaryResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PostController implements PostApi {
  private final PostService postService;

  public PostController(PostService postService) {
    this.postService = postService;
  }

  @Override
  public PageResponse<PostSummaryResponse> listPosts(
      String author, String tag, Integer page, Integer size, String sort) {
    return postService.listPosts(author, tag, page, size);
  }

  @Override
  public PostDetailResponse getPost(Long postId) {
    return postService.getPost(postId);
  }

  @Override
  public PostDetailResponse createPost(PostCreateRequest request, Authentication authentication) {
    return postService.createPost(request, authentication.getName());
  }

  @Override
  public PostDetailResponse updatePost(
      Long postId, PostUpdateRequest request, Authentication authentication) {
    return postService.updatePost(postId, request);
  }

  @Override
  public void deletePost(Long postId, Authentication authentication) {
    postService.deletePost(postId);
  }
}
