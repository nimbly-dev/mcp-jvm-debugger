package com.example.social.post.app.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class TagLifecycleService {
  private final TagsDownstreamClient tagsDownstreamClient;

  public TagLifecycleService(TagsDownstreamClient tagsDownstreamClient) {
    this.tagsDownstreamClient = tagsDownstreamClient;
  }

  public Map<String, Object> createTag(String tenantId, Map<String, Object> body) {
    return tagsDownstreamClient.createTag(tenantId, body);
  }

  public Map<String, Object> lockTag(String tenantId, String tagName, Map<String, Object> userContext) {
    return tagsDownstreamClient.lockTag(tenantId, tagName, userContext);
  }

  public Map<String, Object> deleteTag(String tenantId, String tagName) {
    // Repro behavior for MCPJVM-154: upstream converts downstream 405 to server failure.
    throw new IllegalStateException(
        "Downstream call failed: DELETE /internal-tags-api/tags returned 405 Method Not Allowed"
    );
  }

  static Map<String, Object> ok(String tenantId, String operation) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("tenantId", tenantId);
    payload.put("operation", operation);
    payload.put("status", "ok");
    return payload;
  }
}
