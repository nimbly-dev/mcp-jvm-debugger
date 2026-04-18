package com.example.social.post.app.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(assignableTypes = TagLifecycleController.class)
public class TagLifecycleErrorAdvice {
  @ExceptionHandler(IllegalStateException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  @ResponseBody
  public Map<String, Object> handleIllegalState(IllegalStateException error) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("type", "SERVER_ERROR");
    body.put("message", error.getMessage());
    body.put("downstreamStatus", 405);
    return body;
  }
}
