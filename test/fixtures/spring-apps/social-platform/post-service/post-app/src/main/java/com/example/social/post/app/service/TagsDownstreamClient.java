package com.example.social.post.app.service;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class TagsDownstreamClient {
  public Map<String, Object> createTag(String tenantId, Map<String, Object> body) {
    Map<String, Object> payload = TagLifecycleService.ok(tenantId, "create");
    payload.put("request", new LinkedHashMap<>(body));
    return payload;
  }

  public Map<String, Object> lockTag(String tenantId, String tagName, Map<String, Object> userContext) {
    Map<String, Object> payload = TagLifecycleService.ok(tenantId, "lock");
    payload.put("tagName", tagName);
    payload.put("userContext", new LinkedHashMap<>(userContext));
    return payload;
  }
}
