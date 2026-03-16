package com.nimbly.mcpjavadevtools.agent.runtime.model;

public record ActuationState(
    String mode,
    String actuatorId,
    String targetKey,
    boolean returnBoolean
) {}

