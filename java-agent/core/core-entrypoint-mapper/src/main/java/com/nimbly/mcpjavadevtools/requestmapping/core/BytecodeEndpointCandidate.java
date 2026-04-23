package com.nimbly.mcpjavadevtools.requestmapping.core;

record BytecodeEndpointCandidate(
        String httpMethod,
        String path,
        String ownerFqcn
) {
}
