package com.nimbly.mcpjavadevtools.agent.runtime.model;

public record KeyStatus(
    String key,
    long hitCount,
    long lastHitEpochMs,
    Boolean lineResolvable,
    String lineValidation
) {}

