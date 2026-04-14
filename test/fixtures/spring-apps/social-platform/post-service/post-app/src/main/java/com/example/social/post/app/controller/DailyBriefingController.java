package com.example.social.post.app.controller;

import com.example.social.post.api.inference.*;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DailyBriefingController implements DailyBriefingApi {
  @Override
  public String summary(Integer page) {
    return "summary-page-" + page;
  }
}
