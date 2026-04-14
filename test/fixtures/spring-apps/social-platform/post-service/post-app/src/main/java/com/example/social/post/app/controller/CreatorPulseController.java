package com.example.social.post.app.controller;

import com.example.social.post.api.inference.*;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CreatorPulseController implements CreatorPulseApi {
  @Override
  public String pulse() {
    return "ok";
  }
}
