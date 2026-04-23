package com.nimbly.mcpjavadevtools.requestmapping.core;

import java.util.List;

final class BytecodeParsedClass {
    final String fqcn;
    final String superFqcn;
    final List<String> interfaceFqcns;
    final List<String> classPaths;
    final List<BytecodeParsedMethod> methods;

    BytecodeParsedClass(
            String fqcn,
            String superFqcn,
            List<String> interfaceFqcns,
            List<String> classPaths,
            List<BytecodeParsedMethod> methods
    ) {
        this.fqcn = fqcn;
        this.superFqcn = superFqcn;
        this.interfaceFqcns = interfaceFqcns;
        this.classPaths = classPaths;
        this.methods = methods;
    }
}
