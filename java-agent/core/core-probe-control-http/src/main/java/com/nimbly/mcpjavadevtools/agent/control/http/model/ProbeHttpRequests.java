package com.nimbly.mcpjavadevtools.agent.control.http.model;

import java.util.List;

public final class ProbeHttpRequests {
  private ProbeHttpRequests() {}

  public record StatusBatchRequest(List<String> keys) {}

  public record ResetRequest(String key, List<String> keys, String className) {}

  public record ActuateRequest(String mode, String actuatorId, String targetKey, Boolean returnBoolean) {}
}
