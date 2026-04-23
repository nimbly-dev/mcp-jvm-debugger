package com.nimbly.mcpjavadevtools.requestmapping.core;

import org.objectweb.asm.AnnotationVisitor;
import org.objectweb.asm.ClassVisitor;
import org.objectweb.asm.MethodVisitor;
import org.objectweb.asm.Opcodes;

import java.util.ArrayList;
import java.util.List;

final class ParsedClassVisitor extends ClassVisitor {
    private static final List<String> NO_PATH = List.of("");

    private String fqcn;
    private String superFqcn;
    private final List<String> interfaceFqcns = new ArrayList<>();
    private final List<BytecodeSpringMapping> classMappings = new ArrayList<>();
    private final List<BytecodeParsedMethod> methods = new ArrayList<>();

    ParsedClassVisitor() {
        super(Opcodes.ASM9);
    }

    @Override
    public void visit(
            int version,
            int access,
            String name,
            String signature,
            String superName,
            String[] interfaces
    ) {
        this.fqcn = name == null ? null : name.replace('/', '.');
        this.superFqcn = superName == null ? null : superName.replace('/', '.');
        if (interfaces != null) {
            for (String iface : interfaces) {
                if (iface != null && !iface.isBlank()) {
                    interfaceFqcns.add(iface.replace('/', '.'));
                }
            }
        }
    }

    @Override
    public AnnotationVisitor visitAnnotation(String descriptor, boolean visible) {
        String defaultHttpMethod = SpringMappingAnnotationVisitor.defaultHttpMethodForDescriptor(descriptor);
        if (defaultHttpMethod == null) {
            return null;
        }
        return new SpringMappingAnnotationVisitor(defaultHttpMethod, true, classMappings);
    }

    @Override
    public MethodVisitor visitMethod(
            int access,
            String name,
            String descriptor,
            String signature,
            String[] exceptions
    ) {
        List<BytecodeSpringMapping> mappings = new ArrayList<>();
        return new MethodVisitor(Opcodes.ASM9) {
            @Override
            public AnnotationVisitor visitAnnotation(String annotationDescriptor, boolean visible) {
                String defaultHttpMethod =
                        SpringMappingAnnotationVisitor.defaultHttpMethodForDescriptor(annotationDescriptor);
                if (defaultHttpMethod == null) {
                    return null;
                }
                return new SpringMappingAnnotationVisitor(defaultHttpMethod, false, mappings);
            }

            @Override
            public void visitEnd() {
                methods.add(new BytecodeParsedMethod(name, List.copyOf(mappings)));
            }
        };
    }

    BytecodeParsedClass toParsedClass() {
        if (fqcn == null || fqcn.isBlank()) {
            return null;
        }
        List<String> classPaths = extractClassPaths();
        return new BytecodeParsedClass(
                fqcn,
                superFqcn,
                List.copyOf(interfaceFqcns),
                classPaths,
                List.copyOf(methods)
        );
    }

    private List<String> extractClassPaths() {
        List<String> out = new ArrayList<>();
        for (BytecodeSpringMapping mapping : classMappings) {
            out.addAll(mapping.paths());
        }
        if (out.isEmpty()) {
            out.addAll(NO_PATH);
        }
        return List.copyOf(out);
    }
}
