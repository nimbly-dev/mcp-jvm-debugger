package com.example.social.post.app.controller;

import com.example.social.post.app.service.TagLifecycleService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/tenant/{tenantId}/tags")
public class TagLifecycleController {
  private final TagLifecycleService tagLifecycleService;

  public TagLifecycleController(TagLifecycleService tagLifecycleService) {
    this.tagLifecycleService = tagLifecycleService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.OK)
  public Map<String, Object> createTag(
      @PathVariable String tenantId,
      @RequestBody Map<String, Object> body
  ) {
    return tagLifecycleService.createTag(tenantId, body);
  }

  @PostMapping("/{tagName}/lock")
  @ResponseStatus(HttpStatus.OK)
  public Map<String, Object> lockTag(
      @PathVariable String tenantId,
      @PathVariable String tagName,
      @RequestBody Map<String, Object> userContext
  ) {
    return tagLifecycleService.lockTag(tenantId, tagName, userContext);
  }

  @DeleteMapping("/{tagName}")
  @ResponseStatus(HttpStatus.OK)
  public Map<String, Object> deleteTag(
      @PathVariable String tenantId,
      @PathVariable String tagName
  ) {
    return tagLifecycleService.deleteTag(tenantId, tagName);
  }
}
