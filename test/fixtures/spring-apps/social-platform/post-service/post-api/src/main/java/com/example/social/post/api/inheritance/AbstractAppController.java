package com.example.social.post.api.inheritance;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public abstract class AbstractAppController {
  @GetMapping("/data")
  public String getData() {
    return "ok";
  }

  @PostMapping("/data")
  public String createData() {
    return "ok";
  }

  @PutMapping("/data/{id}")
  public String updateData() {
    return "ok";
  }

  @DeleteMapping("/data/{id}")
  public String deleteData() {
    return "ok";
  }

  @PatchMapping("/data/{id}")
  public String patchData() {
    return "ok";
  }

  @RequestMapping(path = "/data/request", method = RequestMethod.GET)
  public String requestMappedData() {
    return "ok";
  }
}
