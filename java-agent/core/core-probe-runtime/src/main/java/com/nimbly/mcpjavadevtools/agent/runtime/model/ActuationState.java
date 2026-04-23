package com.nimbly.mcpjavadevtools.agent.runtime.model;

public record ActuationState(
    String mode,
    String sessionId,
    String actuatorId,
    String targetKey,
    Boolean returnBoolean,
    Long expiresAtEpoch,
    String scopeState,
    int activeSessionCount
) {}
