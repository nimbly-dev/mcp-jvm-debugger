package com.nimbly.mcpjavadevtools.requestmapping.core;

public record BytecodeResolvedEndpoint(
        String httpMethod,
        String path,
        String mappingOwnerFqcn,
        int uniqueCandidateCount
) {
}
