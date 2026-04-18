package com.example.social.post.api.inference;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/legacy-default")
public interface FeatureFlagsApi {
  @GetMapping("/feature-flags")
  String featureFlags();
}
