package com.nimbly.mcpjavadevtools.requestmapping.core;

import java.util.List;

record BytecodeParsedMethod(
        String name,
        List<BytecodeSpringMapping> mappings
) {
}
