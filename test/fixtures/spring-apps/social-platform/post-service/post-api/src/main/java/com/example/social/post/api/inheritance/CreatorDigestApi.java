package com.example.social.post.api.inheritance;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/v4/creator")
public interface CreatorDigestApi {
  @GetMapping("/digest")
  String digest();
}
