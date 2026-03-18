package com.example.social.post.api;

import com.example.social.post.api.model.PostCreateRequest;
import com.example.social.post.api.model.PostUpdateRequest;
import com.example.social.shared.domain.JsonViews;
import com.example.social.shared.domain.PageResponse;
import com.example.social.shared.domain.PostDetailResponse;
import com.example.social.shared.domain.PostSummaryResponse;
import com.example.social.shared.security.ApiRunAsHeaders;
import com.example.social.shared.security.OwnerOrAdmin;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

@RequestMapping("/api/v1/posts")
public interface PostApi {
  @GetMapping
  @Operation(summary = "List public social posts")
  PageResponse<PostSummaryResponse> listPosts(
      @RequestParam(required = false) String author,
      @RequestParam(required = false) String tag,
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "10") Integer size,
      @RequestParam(defaultValue = "createdAt,desc") String sort);

  @GetMapping("/{postId}")
  @Operation(summary = "View a single post")
  PostDetailResponse getPost(@PathVariable Long postId);

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("isAuthenticated()")
  @ApiRunAsHeaders
  @JsonView(JsonViews.Detail.class)
  @Operation(summary = "Create a new post")
  PostDetailResponse createPost(
      @Valid @RequestBody PostCreateRequest request, Authentication authentication);

  @PutMapping("/{postId}")
  @OwnerOrAdmin
  @ApiRunAsHeaders
  @JsonView(JsonViews.Detail.class)
  @Operation(summary = "Update an existing post")
  PostDetailResponse updatePost(
      @PathVariable Long postId,
      @Valid @RequestBody PostUpdateRequest request,
      Authentication authentication);

  @DeleteMapping("/{postId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @OwnerOrAdmin
  @Operation(summary = "Delete an existing post")
  void deletePost(@PathVariable Long postId, Authentication authentication);
}
