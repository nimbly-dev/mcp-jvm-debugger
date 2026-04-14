package com.nimbly.mcpjavadevtools.requestmapping.extractor.spring;

import com.nimbly.mcpjavadevtools.requestmapping.ast.MethodContext;
import com.nimbly.mcpjavadevtools.requestmapping.ast.ResolvedParameter;
import com.nimbly.mcpjavadevtools.requestmapping.core.TypeIndex;
import com.nimbly.mcpjavadevtools.requestmapping.extractor.MappingExtractor;
import com.nimbly.mcpjavadevtools.requestmapping.resolution.ResolvedMapping;
import com.nimbly.mcpjavadevtools.requestmapping.transport.http.PathMaterializer;

import java.util.List;
import java.util.Optional;

public final class SpringMappingExtractor implements MappingExtractor {
    private final PathMaterializer materializer = new PathMaterializer();

    @Override
    public String strategyId() {
        return "java_ast_spring_mvc_resolver";
    }

    @Override
    public Optional<ResolvedMapping> resolve(MethodContext context, TypeIndex index) {
        Optional<SpringMappingMerger.SpringMethodMapping> methodMapping =
                SpringMappingMerger.resolveMethodMapping(context, index);
        if (methodMapping.isEmpty()) {
            return Optional.empty();
        }

        String classPath = SpringMappingMerger.resolveClassPath(context, index);
        SpringMappingMerger.SpringMethodMapping mapping = methodMapping.get();
        List<ResolvedParameter> parameters = SpringParameterResolver.resolve(context);
        return Optional.of(materializer.materialize(
                "spring_mvc",
                mapping.httpMethod(),
                classPath,
                mapping.methodPath(),
                context,
                parameters
        ));
    }
}


