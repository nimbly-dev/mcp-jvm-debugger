package com.example.social.post.api.inheritance;

public abstract class AbstractCreatorDigestController implements CreatorDigestApi {
  @Override
  public String digest() {
    return "digest-ok";
  }
}
