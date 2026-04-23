package com.nimbly.mcpjavadevtools.agent.runtime.model;

public record SessionActuation(
    String sessionId,
    String actuatorId,
    String targetKey,
    boolean returnBoolean,
    long expiresAtEpoch
) {
  public boolean isExpired(long nowEpochMs) {
    return expiresAtEpoch <= nowEpochMs;
  }
}
