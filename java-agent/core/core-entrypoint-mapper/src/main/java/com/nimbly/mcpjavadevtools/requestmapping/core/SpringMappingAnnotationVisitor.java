package com.nimbly.mcpjavadevtools.requestmapping.core;

import org.objectweb.asm.AnnotationVisitor;
import org.objectweb.asm.Opcodes;

import java.util.ArrayList;
import java.util.List;

final class SpringMappingAnnotationVisitor extends AnnotationVisitor {
    private static final String REQUEST_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/RequestMapping;";
    private static final String GET_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/GetMapping;";
    private static final String POST_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/PostMapping;";
    private static final String PUT_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/PutMapping;";
    private static final String PATCH_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/PatchMapping;";
    private static final String DELETE_MAPPING_DESC = "Lorg/springframework/web/bind/annotation/DeleteMapping;";
    private static final List<String> NO_PATH = List.of("");

    private final String defaultHttpMethod;
    private final boolean allowPathOnlyMapping;
    private final List<BytecodeSpringMapping> sink;
    private final List<String> paths = new ArrayList<>();
    private final List<String> methods = new ArrayList<>();

    SpringMappingAnnotationVisitor(
            String defaultHttpMethod,
            boolean allowPathOnlyMapping,
            List<BytecodeSpringMapping> sink
    ) {
        super(Opcodes.ASM9);
        this.defaultHttpMethod = defaultHttpMethod;
        this.allowPathOnlyMapping = allowPathOnlyMapping;
        this.sink = sink;
    }

    static String defaultHttpMethodForDescriptor(String descriptor) {
        if (REQUEST_MAPPING_DESC.equals(descriptor)) {
            return "";
        }
        if (GET_MAPPING_DESC.equals(descriptor)) {
            return "GET";
        }
        if (POST_MAPPING_DESC.equals(descriptor)) {
            return "POST";
        }
        if (PUT_MAPPING_DESC.equals(descriptor)) {
            return "PUT";
        }
        if (PATCH_MAPPING_DESC.equals(descriptor)) {
            return "PATCH";
        }
        if (DELETE_MAPPING_DESC.equals(descriptor)) {
            return "DELETE";
        }
        return null;
    }

    @Override
    public AnnotationVisitor visitArray(String name) {
        if ("value".equals(name) || "path".equals(name)) {
            return new AnnotationVisitor(Opcodes.ASM9) {
                @Override
                public void visit(String name, Object value) {
                    if (value instanceof String str) {
                        paths.add(str);
                    }
                }
            };
        }
        if ("method".equals(name)) {
            return new AnnotationVisitor(Opcodes.ASM9) {
                @Override
                public void visitEnum(String name, String descriptor, String value) {
                    if (value != null && !value.isBlank()) {
                        methods.add(value);
                    }
                }
            };
        }
        return super.visitArray(name);
    }

    @Override
    public void visit(String name, Object value) {
        if (("value".equals(name) || "path".equals(name)) && value instanceof String str) {
            paths.add(str);
        }
    }

    @Override
    public void visitEnum(String name, String descriptor, String value) {
        if ("method".equals(name) && value != null && !value.isBlank()) {
            methods.add(value);
        }
    }

    @Override
    public void visitEnd() {
        List<String> resolvedPaths = paths.isEmpty() ? NO_PATH : List.copyOf(paths);
        List<String> resolvedMethods = methods.isEmpty() ? List.of(defaultHttpMethod) : List.copyOf(methods);
        for (String httpMethod : resolvedMethods) {
            if (allowPathOnlyMapping && (httpMethod == null || httpMethod.isBlank())) {
                sink.add(new BytecodeSpringMapping("", resolvedPaths));
                continue;
            }
            if (httpMethod == null || httpMethod.isBlank()) {
                continue;
            }
            sink.add(new BytecodeSpringMapping(httpMethod, resolvedPaths));
        }
    }
}
