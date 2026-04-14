package com.example.social.post.api.inference;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/v3/creator")
public interface CreatorPulseApi {
  @GetMapping("/pulse")
  String pulse();
}
