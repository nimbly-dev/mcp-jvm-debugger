package com.example.social.post.app.controller;

import com.example.social.post.api.inference.FeatureFlagsApi;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v9")
public class FeatureFlagsController implements FeatureFlagsApi {
  @Override
  public String featureFlags() {
    return "feature-flags-ok";
  }
}
