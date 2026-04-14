package com.example.social.post.api.inference;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping(DailyBriefingApi.API_BASE + "/briefing")
public interface DailyBriefingApi {
  String API_BASE = "/api/v3";
  String SEGMENT = "/daily";

  @RequestMapping(path = {SEGMENT + "/summary", "/unused"}, method = {RequestMethod.GET})
  String summary(@RequestParam(defaultValue = "1") Integer page);
}
