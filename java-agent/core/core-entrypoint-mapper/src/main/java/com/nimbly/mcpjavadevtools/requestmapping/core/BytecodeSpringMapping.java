package com.nimbly.mcpjavadevtools.requestmapping.core;

import java.util.List;

record BytecodeSpringMapping(
        String httpMethod,
        List<String> paths
) {
}
